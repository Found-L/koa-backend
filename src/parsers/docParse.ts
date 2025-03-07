// src/parsers/docParse.ts

import WordExtractor from 'word-extractor';

export async function parseDocFile(filePath: string, mimeType: string,linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    if (mimeType !== 'application/msword') {
      throw new Error('不支持的文件类型，无法解析 Word 文件');
    }

    const extractor = new WordExtractor();
    const extracted = await extractor.extract(filePath);
    const content = extracted.getBody();

    if (!content) {
      throw new Error('无法提取 .doc 文件内容');
    }

    // 按行拆分文本，并过滤空行
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const pages: PageContent[] = [];

    let currentPageText = '';
    let currentPageLines: LineContent[] = [];
    let lineNumber = 1;
    let pageNumber = 1;

    // 将文本分页
    lines.forEach(line => {
      const lineContent: LineContent = {
        lineNumber: lineNumber++,
        text: line,
      };

      if (currentPageLines.length < linesPerPage) {
        // 如果当前页未达到最大行数，继续添加当前行
        currentPageLines.push(lineContent);
        currentPageText += line + '\n';
      } else {
        // 如果当前页已满，保存当前页内容并开始新的一页
        pages.push({
          pageNumber,
          text: currentPageText.trim(),
          lines: currentPageLines,
        });

        // 开始新的一页
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

    // 返回解析后的内容
    return {
      pages: pages,
      content: content,
    };
  } catch (error) {
    console.error('解析 .doc 文件时出错:', error);
    throw new Error('解析 .doc 文件失败');
  }
}

