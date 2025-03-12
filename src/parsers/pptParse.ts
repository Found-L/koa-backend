// src/parsers/pptParse.ts

import fs from 'fs';
import { parse } from 'ppt-parser';

import * as cheerio from 'cheerio';
// 解析 HTML 并提取文本
export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  return $('body').text().trim().replace(/\s+/g, ' ');  // 去除多余空格和换行
}

export async function parsePptFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (!['application/vnd.ms-powerpoint',"application/vnd.openxmlformats-officedocument.presentationml.presentation"].includes(mimeType)) {
      throw new Error('不支持的文件类型，无法解析 PPT 文件');
    }

    // 读取 PPT 文件为 Buffer
    const fileBuffer = fs.readFileSync(filePath);

    const fileObject = await parseAsync(fileBuffer);

    if (fileObject && fileObject.slides.length === 0) {
      throw new Error('解析 PPT 文件内容为空');
    }

    let content = '';
    const pages: PageContent[] = [];
    let lineNumber = 1;
    let pageNumber = 1;

    fileObject.slides.forEach((slide: any) => {
      const { text, lines } = extractTextFromElements(slide.elements, lineNumber);

      pages.push({ pageNumber, text, lines });
      if (lines.length > 0) {
        content += text + '\n';
      }
      // 开始新的一页
      pageNumber++;
    });

    return { pages, content };
  } catch (error) {
    // console.error('解析 PPT/PPTX 文件时出错:', error);
    throw new Error('解析 PPT 文件失败');
  }
}

function extractTextFromElements(elements: any[], lineNumber: number): { text: string; lines: LineContent[] } {
  let extractedText = '';
  let extractedLines: LineContent[] = [];

  elements.forEach((element: any) => {
    if (element.type === 'group' && element.elements) {
      // 递归处理 group 内的 elements
      const { text, lines } = extractTextFromElements(element.elements, lineNumber);
      extractedText += text + '\n';
      extractedLines.push(...lines);
    } else if (element.type === "table") {
        const { text, lines } = extractTableContent(element.data, lineNumber);
        extractedText += text + '\n';
        extractedLines.push(...lines);
    } else if (element.type === "chart") {
        const { text, lines } = convertChartToMarkdown(element.data, lineNumber);
        extractedText += text + '\n';
        extractedLines.push(...lines);
    } else if (element.content) {
      // 解析文本
      const text = extractTextFromHtml(element.content);
      if (text) {
        const lineContent: LineContent = { lineNumber: lineNumber++, text };
        extractedLines.push(lineContent);
        extractedText += text + '\n';
      }
    }
  });

  return { text: extractedText.trim(), lines: extractedLines };
}

// 提取表格并转换为 Markdown 格式，并返回每一行作为单独的 lineContent
function extractTableContent(tableData: any, lineNumber: number): { text: string; lines: LineContent[] } {
  let tableMarkdown = '';
  let tableLines: LineContent[] = [];

  // 直接遍历 tableData（每一项代表一行）
  tableData.forEach((row: any) => {
    const rowMarkdown = row.map((cell: any) => {
      // 清除单元格内的 HTML 标签并提取文本
      return extractTextFromHtml(cell.text || '').trim();
    }).join(' | ');

    // 将每一行的内容加入 lineContent
    const rowText = rowMarkdown.trim();
    const lineContent: LineContent = { lineNumber: lineNumber++, text: rowText };
    tableLines.push(lineContent);

    tableMarkdown += `| ${rowMarkdown} |\n`;

    // 如果是表头，添加分隔线（假设第一行是表头）
    if (tableData.indexOf(row) === 0) {
      tableMarkdown += `|${' --- |'.repeat(row.length)}\n`;
    }
  });

  return { text: tableMarkdown, lines: tableLines };
}

// 转换函数
function convertChartToMarkdown(chart: ChartData[], lineNumber: number): { text: string; lines: LineContent[] } {
  let tableMarkdown = '';
  let tableLines: LineContent[] = [];

  // 表头: 先添加列名
  const header = ['类别', ...chart.map(series => series.key)].join(' | ');
  const headerLine: LineContent = { lineNumber: lineNumber++, text: header };
  tableLines.push(headerLine);
  tableMarkdown += `| ${header} |\n`;

  // 分隔线
  const separator = `| --- | ${'--- |'.repeat(chart.length)}`;
  const separatorLine: LineContent = { lineNumber: lineNumber++, text: separator };
  tableLines.push(separatorLine);
  tableMarkdown += `| --- | ${'--- |'.repeat(chart.length)}\n`; // 在此添加换行符

  // 找出所有的类别 (假设每个系列的 xlabels 是一样的)
  const xlabels = chart[0].xlabels;

  // 遍历每个类别，生成每一行数据
  Object.keys(xlabels).forEach((key) => {
    const row: string[] = [xlabels[key]];  // 开始一行，先加上类别

    // 遍历每个系列的值，按顺序添加到当前行
    chart.forEach((series) => {
      const value = series.values.find(value => value.x === key);
      row.push(value ? value.y.toString() : ''); // 如果没有找到对应的值，填空
    });

    // 生成当前行文本
    const rowText = row.join(' | ');
    const rowLine: LineContent = { lineNumber: lineNumber++, text: rowText };
    tableLines.push(rowLine);
    tableMarkdown += `| ${rowText} |\n`; // 每行后添加换行符
  });

  return { text: tableMarkdown, lines: tableLines };
}

function parseAsync(fileBuffer: Buffer): Promise<PPTContent> {
  return new Promise((resolve, reject) => {
    parse(fileBuffer, {}).then((data:any) => {
      resolve(data);
    }).catch((err: any) => {
      console.error("解析失败:", err);
      reject(err);
    });
  });
}

interface PPTContent {
  slides:[],
  size: {},
}

// 定义 ChartData 类型
interface ChartData {
  key: string; // 系列名称
  values: { x: string; y: number }[]; // 系列的值
  xlabels: { [key: string]: string }; // x轴标签（类别）
}