// src/parsers/pdfParser.ts

import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import path from 'path';

export async function parsePdfFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType === 'application/pdf') {
      const data = await fs.readFile(filePath);
      const pdfData = await pdfParse(data);
      const pdfFileName = path.basename(filePath);
      const result: ParsedContent = {
        fileName: pdfFileName,
        mimeType,
        pages: [],
        content: '',
      };

      let currentPageContent: PageContent | null = null;

      // 假设每页有20行，根据实际情况调整
      pdfData.text.split('\n').forEach((line, index) => {
        const pageNumber = Math.floor(index / 20) + 1;  // 假设每页有 20 行

        result.content += line.trim() + ' ';

        if (!currentPageContent || currentPageContent.pageNumber !== pageNumber) {
          if (currentPageContent) {
            result.pages.push(currentPageContent);
          }
          currentPageContent = { pageNumber, lines: [] };
        }

        currentPageContent.lines.push({
          lineNumber: index % 20 + 1,  // 行号
          text: line.trim()
        });
      });

      if (currentPageContent) {
        result.pages.push(currentPageContent);
      }

      return result;
    } else {
      throw new Error('Unsupported file type for PDF parsing');
    }
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}
