// src/parsers/pdfParser.ts

import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

type TextItem = {
  text: string; // 文本内容
  x: number; // X 坐标
  y: number; // Y 坐标
};

export async function parsePdfFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/pdf') {
      throw new Error('Unsupported file type for PDF parsing');
    }

    const fileBuffer = await fs.readFile(filePath);
    const uint8ArrayData = new Uint8Array(fileBuffer);

    // 使用 pdf-lib 获取 PDF 页数
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = pdfDoc.getPageCount();

    // 使用 pdfjs-dist 解析 PDF 文本
    const loadingTask = pdfjsLib.getDocument({ data: uint8ArrayData });
    const pdfData = await loadingTask.promise;

    const result: ParsedContent = {
      pages: [],
      content: '',
    };

    // 并行解析每一页
    const pagePromises: Promise<PageContent>[] = [];
    for (let i = 0; i < totalPages; i++) {
      pagePromises.push(parsePage(pdfData, i + 1));
    }
    const pages = await Promise.all(pagePromises);

    // 将解析结果添加到最终结果中
    result.pages = pages;
    result.content = pages.map((page) => page.text).join('\n');

    return result;
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file');
  }
}

async function parsePage(pdfData: any, pageNumber: number): Promise<PageContent> {
  const page = await pdfData.getPage(pageNumber);
  const textContent = await page.getTextContent();

  let pageText = '';
  const lines: LineContent[] = [];

  // 解析文本内容并按 Y 轴分组
  const textItems: TextItem[] = textContent.items.map((item: any) => ({
    text: item.str.trim(),
    x: item.transform[4], // X 坐标
    y: item.transform[5], // Y 坐标
  }));

  // 按 Y 轴（行）分组
  const lineGroups: { [key: number]: { x: number; text: string }[] } = {};
  const threshold = 5; // 允许的 Y 轴偏差

  textItems.forEach(({ text, x, y }) => {
    if (!text) return;

    const existingLineY = Object.keys(lineGroups)
      .map(Number)
      .find((lineY) => Math.abs(lineY - y) < threshold);

    if (existingLineY) {
      lineGroups[existingLineY].push({ x, text });
    } else {
      lineGroups[y] = [{ x, text }];
    }
  });

  // 处理每一行：按 X 坐标排序并拼接文本
  let lineNumber = 1;
  Object.keys(lineGroups)
    .map(Number)
    .sort((a, b) => b - a) // 按 Y 坐标降序排列
    .forEach((lineY) => {
      const line = lineGroups[lineY]
        .sort((a, b) => a.x - b.x) // 按 X 坐标排序
        .map((item) => item.text)
        .join(' ');

      lines.push({ lineNumber, text: line });
      pageText += line + '\n';
      lineNumber++;
    });

  return {
    pageNumber,
    text: pageText.trim(),
    lines,
  };
}