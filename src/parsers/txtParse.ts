
// src/parsers/txtParse.ts

import fs from 'fs/promises';
import path from 'path';

export async function parseTextFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'text/plain') {
      throw new Error('Unsupported file type for text parsing');
    }

    const textFileName = path.basename(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // 将文本内容分割成页面，假设每50行作为一页
    const lines = fileContent.split('\n');
    const linesPerPage = 50; // 每页50行，你可以根据需求调整
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

      // 每50行保存为一页
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
      fileName: textFileName,
      mimeType,
      pages: pages,
      content: fileContent,
    };
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw new Error('Failed to parse text file');
  }
}
