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

    const pdfFileName = path.basename(filePath);
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

      const lines: LineContent[] = [];
      let pageText = '';

      let lastY: number | null = null; // ✅ 确保 lastY 有正确类型

      let currentLine: LineContent | null = null;
      let lineNumber = 1;

      textContent.items.forEach((item: any) => {
        const text = item.str.trim();
        if (!text) return;

        const y = item.transform[5]; // 获取 Y 坐标

        if (lastY === null || Math.abs(lastY - y) > 5) {
          // Y 轴差异较大，视为新的一行
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = { lineNumber, text: '' };
          lineNumber++;
        }

        if (currentLine) {
          currentLine.text += text + ' ';
        }

        lastY = y;
        pageText += text + ' ';
      });

      if (currentLine) {
        lines.push(currentLine);
      }

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
