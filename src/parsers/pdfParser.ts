// src/parsers/pdfParser.ts

import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export async function parsePdfFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/pdf') {
      throw new Error('Unsupported file type for PDF parsing');
    }

    const pdfFileName = path.basename(filePath.replace(/^.*?_(.*)$/, '$1'));
    const fileBuffer = await fs.readFile(filePath);

    // ✅ 解决方案：将 Buffer 转换为 Uint8Array
    const uint8ArrayData = new Uint8Array(fileBuffer);

    // 使用 pdf-lib 获取 PDF 页数
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = pdfDoc.getPageCount();

    // 使用 pdfjs-dist 解析 PDF 文本
    const loadingTask = pdfjsLib.getDocument({ data: uint8ArrayData });
    const pdfData = await loadingTask.promise;

    const result: ParsedContent = {
      fileName: pdfFileName,
      mimeType,
      pages: [],
      content: '',
    };

    for (let i = 0; i < totalPages; i++) {
      const page = await pdfData.getPage(i + 1); // 获取第 i+1 页
      const textContent = await page.getTextContent();

      let pageText = '';
      const lines: LineContent[] = [];

      // **1. 解析文本内容并按 Y 轴分组**
      const textItems = textContent.items.map((item: any) => ({
        text: item.str.trim(),
        x: item.transform[4], // X 坐标
        y: item.transform[5], // Y 坐标
      }));

      // **2. 按 Y 轴（行）分组**
      const lineGroups: { [key: number]: { x: number; text: string }[] } = {};
      const threshold = 5; // 允许的 Y 轴偏差（避免因为微小误差导致分组错误）

      textItems.forEach(({ text, x, y }) => {
        if (!text) return;

        // 找到是否已存在接近的 Y 轴行
        const existingLineY = Object.keys(lineGroups)
        .map(Number) // 将字符串数组转换为数字数组
        .find((lineY) => Math.abs(lineY - y) < threshold);


        if (existingLineY) {
          lineGroups[existingLineY].push({ x, text });
        } else {
          lineGroups[y] = [{ x, text }];
        }
      });

      // **3. 处理每一行：按 X 坐标排序并拼接文本**
      let lineNumber = 1;
      Object.keys(lineGroups)
        .map(Number) // 将字符串数组转换为数字数组
        .sort((a, b) => b - a) // 🔥 按 Y 坐标降序排列
        .forEach((lineY) => {
          const line = lineGroups[lineY]
            .sort((a, b) => a.x - b.x) // 按 X 坐标排序
            .map((item) => item.text)
            .join(' ');

          lines.push({ lineNumber, text: line });
          pageText += line + '\n';
          lineNumber++;
        });

      result.pages.push({
        pageNumber: i + 1,
        text: pageText.trim(), // ✅ 存储整页文本内容
        lines,
      });

      result.content += pageText.trim() + '\n';
    }

    return result;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}
