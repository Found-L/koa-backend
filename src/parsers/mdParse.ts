// src/parsers/docxParse.ts

import fs from 'fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

export async function parseMarkdownFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'text/markdown') {
      throw new Error('Unsupported file type for markdown parsing');
    }

    const markdownContent = await fs.readFile(filePath, 'utf-8');

    // 使用 remark 解析 Markdown 内容
    const parsed = await unified()
      .use(remarkParse)
      .use(remarkStringify)
      .process(markdownContent);

    // 以每50行分割成页
    const lines = parsed.toString().split('\n');
    const linesPerPage = 50; // 每页50行
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
      pages: pages,
      content: parsed.toString(),
    };
  } catch (error) {
    console.error('Error parsing markdown file:', error);
    throw new Error('Failed to parse markdown file');
  }
}
