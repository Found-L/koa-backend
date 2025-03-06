// src/parsers/docxParse.ts

import fs from 'fs/promises';
import mammoth from 'mammoth';
import path from 'path';

export async function parseWordFile(filePath: string, mimeType: string, linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('不支持的文件类型，无法解析 Word 文件');
    }

    const fileBuffer = await fs.readFile(filePath);

    // 使用 Mammoth 提取 DOCX 文件中的原始文本
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    const content = parsed.value;

    // 按行拆分文本
    // const lines = content.split('\n');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const pages: PageContent[] = [];

    let currentPageText = '';
    let currentPageLines: LineContent[] = [];
    let lineNumber = 1;
    let pageNumber = 1;

    lines.forEach(line => {
      const lineContent: LineContent = {
        lineNumber: lineNumber++,
        text: line,
      };

      if (currentPageLines.length < linesPerPage) {
        // 如果当前页没有达到最大行数，则继续添加当前行
        currentPageLines.push(lineContent);
        currentPageText += line + '\n';
      } else {
        // 如果当前页已经满了，先保存当前页内容，然后开始新的一页
        pages.push({
          pageNumber,
          text: currentPageText.trim(),
          lines: currentPageLines,
        });

        // 开始新的页
        pageNumber++;
        currentPageText = line + '\n';
        currentPageLines = [lineContent];
      }
    });

    // 将剩余的行添加到最后一页
    if (currentPageLines.length > 0) {
      pages.push({
        pageNumber,
        text: currentPageText.trim(),
        lines: currentPageLines,
      });
    }

    return {
      pages: pages,
      content: content,
    };
  } catch (error) {
    console.error('解析 Word 文件时出错:', error);
    throw new Error('解析 Word 文件失败');
  }
}
