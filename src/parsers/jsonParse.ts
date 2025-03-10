// src/parsers/jsonParse.ts

import fs from 'fs/promises';

export async function parseJsonFile(filePath: string, mimeType: string, linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/json') {
      throw new Error('Unsupported file type for JSON parsing');
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // 将 JSON 转换为键值对的数组
    const entries: { key: string; value: any }[] = flattenJson(jsonData);

    const pages: PageContent[] = [];
    let currentPageLines: LineContent[] = [];
    let pageNumber = 1;
    let lineNumber = 1;

    entries.forEach(({ key, value }) => {
      const lineContent: LineContent = { lineNumber: lineNumber++, text: `${key}: ${value}` };

      if (currentPageLines.length < linesPerPage) {
        currentPageLines.push(lineContent);
      } else {
        // 拼接当前页的所有 lineContent 的 text
        const pageText = currentPageLines.map(line => line.text).join('\n');
        pages.push({
          pageNumber,
          text: pageText,  // 当前页的 text 是所有 lineContent 的 text 拼接
          lines: currentPageLines,
        });

        pageNumber++;
        currentPageLines = [lineContent];
      }
    });

    // 添加最后一页
    if (currentPageLines.length > 0) {
      const pageText = currentPageLines.map(line => line.text).join('\n');
      pages.push({
        pageNumber,
        text: pageText,  // 最后一页的 text 是所有 lineContent 的 text 拼接
        lines: currentPageLines,
      });
    }

    // 拼接所有页的 text 作为 content
    const contentText = pages.map(page => page.text).join('\n');

    return { pages, content: contentText };  // 返回拼接后的内容
  } catch (error) {
    console.error('解析 JSON 文件时出错:', error);
    throw new Error('解析 JSON 文件失败');
  }
}

function flattenJson(obj: any, prefix = ''): { key: string; value: any }[] {
  let result: { key: string; value: any }[] = [];

  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result = result.concat(flattenJson(obj[key], newKey));
      } else {
        result.push({ key: newKey, value: obj[key] });
      }
    }
  }

  return result;
}
