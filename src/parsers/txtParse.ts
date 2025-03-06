
// src/parsers/txtParse.ts

import fs from 'fs/promises';
import path from 'path';
import iconv from 'iconv-lite';
import chardet from 'chardet';

export async function parseTextFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'text/plain') {
      throw new Error('Unsupported file type for text parsing');
    }

    const fileBuffer = await fs.readFile(filePath);

    // 检测编码
    const detectedEncoding = chardet.detect(fileBuffer) || 'utf-8';
    console.log(`Detected Encoding: ${detectedEncoding}`);

    // 转换为 utf-8
    const fileContent = iconv.decode(fileBuffer, detectedEncoding);

    // 分页逻辑
    const lines = fileContent.split('\n');
    const linesPerPage = 50;
    let pageNumber = 1;
    let currentPageText = '';
    let currentPageLines: LineContent[] = [];

    const pages: PageContent[] = [];

    lines.forEach((line, index) => {
      const lineContent: LineContent = {
        lineNumber: index + 1,
        text: line.trim(),
      };

      currentPageLines.push(lineContent);
      currentPageText += line.trim() + ' ';

      if (currentPageLines.length >= linesPerPage || index === lines.length - 1) {
        pages.push({
          pageNumber,
          text: currentPageText,
          lines: currentPageLines,
        });

        pageNumber++;
        currentPageText = '';
        currentPageLines = [];
      }
    });

    return {
      pages,
      content: fileContent,
    };
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw new Error('Failed to parse text file');
  }
}
