// src/parsers/docxParse.ts

import fs from 'fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export async function parseMarkdownFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'text/markdown') {
      throw new Error('Unsupported file type for markdown parsing');
    }

    const markdownContent = await fs.readFile(filePath, 'utf-8');

    // 先处理格式符号如删除线、上标、下标和高亮
    const processedContent = processMarkdownFormatting(markdownContent);

    // 使用 remark 解析 Markdown 内容
    const parsed = await unified()
      .use(remarkParse)
      .use(remarkRehype)  // 使用 remark-rehype 插件解析 HTML
      .use(rehypeStringify)  // 将 HTML 转换成字符串
      .process(processedContent);

    const htmlContent = parsed.toString();

    // 提取 HTML 内容
    const contentWithoutHtml = extractTextFromHtml(htmlContent);

    // 以每50行分割成页
    const lines = contentWithoutHtml.split('\n');
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
      content: contentWithoutHtml,  // 返回没有 HTML 标签的纯文本内容
    };
  } catch (error) {
    console.error('Error parsing markdown file:', error);
    throw new Error('Failed to parse markdown file');
  }
}

// 从 HTML 内容中提取文本
function extractTextFromHtml(html: string): string {
  const regex = /<[^>]+>/g;  // 匹配 HTML 标签
  return html.replace(regex, '').trim();  // 删除 HTML 标签，提取纯文本
}

// 处理 Markdown 格式化符号，如上标、下标、删除线、下划线、高亮等
function processMarkdownFormatting(markdown: string): string {
  // // 上标（^）
  // markdown = markdown.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');

  // // 下标（~）
  // markdown = markdown.replace(/~([^~]+)~/g, '<sub>$1</sub>');

  // 删除线（~~）
  markdown = markdown.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 高亮（==）
  markdown = markdown.replace(/==([^=]+)==/g, '<mark>$1</mark>');

  return markdown;
}
