// src/parsers/htmlParse.ts

import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import chardet from 'chardet';

// 表格内容类型定义
interface TableRowContent {
  cells: { text: string }[];
}

// 读取文件并自动检测编码
async function readFileWithEncoding(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);

  // 自动检测编码
  const detectedEncoding = chardet.detect(buffer);

  let encoding = detectedEncoding?.toLowerCase() || 'utf-8';

  // 特殊处理 UTF-16，chardet 可能检测到 "UTF-16LE" 或 "UTF-16BE"
  if (encoding.includes('utf-16')) {
    encoding = encoding.includes('be') ? 'utf-16be' : 'utf-16le';
  }

  // 转换为 UTF-8
  const content = iconv.decode(buffer, encoding);

  return content;
}

// 判断元素是否为行内元素的函数
function isInlineElement(element: cheerio.Element): boolean {
  // 默认认为是行内元素
  if (element.type === 'tag') {
    const inlineElements = ['span', 'a', 'b', 'i', 'strong', 'em', 'abbr', 'img']; // 行内元素的常见标签
    return inlineElements.includes(element.name);
  }
  return false;
}

// 解析 HTML 文件
export async function parseHtmlFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'text/html') {
      throw new Error('Unsupported file type for HTML parsing');
    }

    const fileBuffer = await readFileWithEncoding(filePath); // 读取文件内容

    const $ = cheerio.load(fileBuffer);
    const content: string[] = [];
    const pages: PageContent[] = [];

    // 直接获取 body
    const body = $('body');

    if (!body.length) {
      throw new Error('No <body> tag found in HTML file');
    }

    let lineNumber = 1;
    const pageText: string[] = [];
    const lines: LineContent[] = [];

    // 提取文本，避免重复
    const extractedTexts: Set<string> = new Set();
    const visitedElements: Set<cheerio.Element> = new Set();

    function extractTextRecursively(element: cheerio.Element): void {
      // 防止死循环
      if (visitedElements.has(element)) return;
      visitedElements.add(element);

      // 如果是文本节点，处理文本
      if (element.type === 'text' && element.data) {
        const text = element.data.trim();
        if (text && !extractedTexts.has(text)) {
          extractedTexts.add(text);
          content.push(text);  // 保存文本到 content 中
          pageText.push(text.trim());  // 保存表格行内容到 pageText 中
          lines.push({ lineNumber, text: text.trim() });  // 保存表格行内容到 lines 中
          // lineNumber++;
        }
        return;  // 文本节点结束，不继续遍历
      }

      // 如果是表格元素 tr, th, td
      if (element.type === 'tag' && (element.name === 'tr' || element.name === 'th' || element.name === 'td')) {
        const tagElement = element as cheerio.TagElement;

        // 处理表格行 (tr)
        if (element.name === 'tr') {
          let rowMarkdown = '|';  // 表格行的开始部分
          tagElement.children.forEach((child) => {
            if (child.type === 'text') {
              // 处理文本内容
              const cellText = (child as cheerio.TextElement).data?.trim();
              if (cellText) {
                rowMarkdown += ` ${cellText} |`;
              }
            } else if (child.type === 'tag') {
              // 处理标签元素 (如 td 或 th)
              const cellText = (child as cheerio.TagElement).children
                .map((subChild) => (subChild.type === 'text' ? (subChild as cheerio.TextElement).data?.trim() : ''))
                .join('');  // 获取所有子文本
              rowMarkdown += ` ${cellText} |`;
            }
          });
          content.push(rowMarkdown.trim());  // 保存表格行内容到 content 中
          pageText.push(rowMarkdown.trim());  // 保存表格行内容到 pageText 中
          lines.push({ lineNumber, text: rowMarkdown.trim() });  // 保存表格行内容到 lines 中
          lineNumber++;
        }
        return;  // 如果是表格元素则跳过递归子元素
      }

       // 如果是标签节点，递归处理其子节点
      if (element.type === 'tag') {
        const tagElement = element as cheerio.TagElement;

        // 如果是行内元素，将其子元素合并为一行文本
        if (isInlineElement(element)) {
          let inlineText = '';
          tagElement.children?.forEach((child) => {
            if (child.type === 'text') {
              const text = (child as cheerio.TextElement).data?.trim();
              if (text) {
                inlineText += ` ${text}`;  // 将文本合并到一行
              }
            }
          });
          if (inlineText.trim()) {
            extractedTexts.add(inlineText.trim())
            content[content.length - 1] += inlineText.trim();  // 将合并后的行内文本添加到 content 中
            pageText[pageText.length - 1] += inlineText.trim();  // 保存表格行内容到 pageText 中
            lines[lines.length - 1].text += inlineText.trim();  // 保存表格行内容到 lines 中
          }
        } else {
          lineNumber++;
        }

        // 递归遍历子元素
        tagElement.children?.forEach((child) => {
          extractTextRecursively(child);
        });
      }
    }

    // 从 body 元素开始递归提取文本
    body.children().each((_, element) => {
      extractTextRecursively(element);
    });

    // 组装页面数据
    pages.push({
      pageNumber: 1,
      text: pageText.join('\n'),
      lines,
    });


    return {
      pages,
      content: content.join('\n\n') // 合并文本和表格内容
    };
  } catch (error) {
    console.error('Error parsing HTML file:', error);
    throw new Error('Failed to parse HTML file');
  }
}
