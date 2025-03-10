// src/parsers/pptParse.ts

import officeParser from 'officeparser';

export async function parsePptFile(filePath: string, mimeType: string, linesPerPage: number = 10): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      throw new Error('不支持的文件类型，无法解析 PPTX 文件');
    }

    const text = await parseOfficeAsync(filePath);
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const pages: PageContent[] = [];
    let currentPageText = '';
    let currentPageLines: LineContent[] = [];
    let lineNumber = 1;
    let pageNumber = 1;

    lines.forEach(line => {
      const lineContent: LineContent = { lineNumber: lineNumber++, text: line };

      if (currentPageLines.length < linesPerPage) {
        currentPageLines.push(lineContent);
        currentPageText += line + '\n';
      } else {
        pages.push({ pageNumber, text: currentPageText.trim(), lines: currentPageLines });

        // 开始新的一页
        pageNumber++;
        currentPageText = line + '\n';
        currentPageLines = [lineContent];
      }
    });

    if (currentPageLines.length > 0) {
      pages.push({ pageNumber, text: currentPageText.trim(), lines: currentPageLines });
    }

    return { pages, content: text };
  } catch (error) {
    // console.error('解析 PPT/PPTX 文件时出错:', error);
    throw new Error('解析 PPTX 文件失败');
  }
}


function parseOfficeAsync(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(filePath, (text: string, err: Error | null, ) => {
      if (err) {
        reject(err);
      } else {
        resolve(text);
      }
    });
  });
}