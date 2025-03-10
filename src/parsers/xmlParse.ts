import fs from 'fs/promises';
import { parseStringPromise } from 'xml2js';

export async function parseXmlFile(filePath: string, mimeType: string, linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/xml' && mimeType !== 'text/xml') {
      throw new Error('不支持的文件类型，无法解析 xml 文件');
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsedXml = await parseStringPromise(fileContent, { explicitArray: true });

    // 提取所有文本内容
    const extractText = (obj: any): string => {
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) {
        return obj.map(extractText).join('\n');
      }
      if (typeof obj === 'object') {
        return Object.values(obj).map(extractText).join('\n');
      }
      return '';
    };

    const content = extractText(parsedXml);
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const pages: PageContent[] = [];

    let currentPageLines: LineContent[] = [];
    let currentPageText = '';
    let lineNumber = 1;
    let pageNumber = 1;

    lines.forEach(line => {
      const lineContent: LineContent = {
        lineNumber: lineNumber++,
        text: line,
      };

      if (currentPageLines.length < linesPerPage) {
        currentPageLines.push(lineContent);
        currentPageText += line + '\n';
      } else {
        pages.push({
          pageNumber,
          text: currentPageText.trim(),
          lines: currentPageLines,
        });
        pageNumber++;
        currentPageText = line + '\n';
        currentPageLines = [lineContent];
      }
    });

    if (currentPageLines.length > 0) {
      pages.push({
        pageNumber,
        text: currentPageText.trim(),
        lines: currentPageLines,
      });
    }

    return { pages, content };
  } catch (error) {
    console.error('解析 XML 文件时出错:', error);
    throw new Error('解析 XML 文件失败');
  }
}
