// src/parsers/xlsxParse.ts

import fs from 'fs/promises';
import XLSX from 'xlsx';

export async function parseXlsxFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/vnd.ms-excel' && mimeType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      throw new Error('Unsupported file type for XLS/XLSX parsing');
    }

    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    // 处理合并单元格
    const merges = worksheet["!merges"] || [];
    const mergedCellsMap = new Map<string, string>();

    merges.forEach(({ s, e }) => {
      const startCell = XLSX.utils.encode_cell(s);
      const mergedValue = worksheet[startCell]?.v ?? "";
      for (let row = s.r; row <= e.r; row++) {
        for (let col = s.c; col <= e.c; col++) {
          const cellKey = `${row}-${col}`;
          if (row === s.r && col === s.c) continue;
          mergedCellsMap.set(cellKey, mergedValue);
        }
      }
    });

    // 过滤掉全是空字符串的行
    const filteredData = jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ""));

    // **判断表头位置**（找出列数最多的行，或者首个非空的行）
    let headerRowIndex = 0;
    let maxColumns = 0;
    filteredData.forEach((row, index) => {
      const nonEmptyCount = row.filter(cell => cell !== null && cell !== undefined && cell !== "").length;
      if (nonEmptyCount > maxColumns) {
        maxColumns = nonEmptyCount;
        headerRowIndex = index;
      }
    });

    const headerRow = filteredData[headerRowIndex];
    const columnWidths = headerRow.map(cell => (cell ? String(cell).length : 3));

    // 计算列宽
    filteredData.forEach(row => {
      row.forEach((cell, colIndex) => {
        const content = String(cell ?? mergedCellsMap.get(`${jsonData.indexOf(row)}-${colIndex}`) ?? "").trim();
        columnWidths[colIndex] = Math.max(columnWidths[colIndex] || 0, content.length);
      });
    });

    // 构建 Markdown 表格
    const markdownTable: string[] = [];

    filteredData.forEach((row, rowIndex) => {
      const markdownRow = row.map((cell, colIndex) => {
        const content = String(cell ?? mergedCellsMap.get(`${rowIndex}-${colIndex}`) ?? "").trim();
        return ` ${content.padEnd(columnWidths[colIndex])} `;
      });

      markdownTable.push(`|${markdownRow.join("|")}|`);

      if (rowIndex === headerRowIndex) {
        // 添加分割行
        const separator = columnWidths.map(width => "-".repeat(width + 2)).join("|");
        markdownTable.push(`|${separator}|`);
      }
    });

    // **分页处理**
    const lines = markdownTable.map((text, index) => ({
      lineNumber: index + 1,
      text
    }));

    const linesPerPage = 50;
    const pages: PageContent[] = [];
    let pageNumber = 1;
    let currentPageLines: LineContent[] = [];

    lines.forEach((line, index) => {
      currentPageLines.push(line);

      if (currentPageLines.length >= linesPerPage || index === lines.length - 1) {
        pages.push({
          pageNumber,
          text: currentPageLines.map(l => l.text).join("\n"),
          lines: currentPageLines
        });

        pageNumber++;
        currentPageLines = [];
      }
    });

    return {
      fileName: filePath.split('/').pop(),
      filePath,
      mimeType,
      pages,
      content: markdownTable.join("\n")
    };

  } catch (error) {
    console.error("Error parsing XLS/XLSX file:", error);
    throw new Error("Failed to parse XLS/XLSX file");
  }
}