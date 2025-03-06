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

      let lineNumber = 1;

      // **1. 按顺序提取每一行的文本**
      textContent.items.forEach((item: any) => {
        const lineText = item.str.trim();
        if (lineText) {
          lines.push({ lineNumber, text: lineText });
          pageText += lineText + ' ';
          lineNumber++;
        }
      });

      result.pages.push({
        pageNumber: i + 1,
        text: pageText.trim(), // 存储整页文本内容
        lines, // 保存按行提取的文本
      });

      result.content += pageText.trim() + '\n';
    }

    return result;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}
