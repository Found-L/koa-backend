// src/parsers/docxParse.ts

import path from 'path';
import docx4js from 'docx4js';

export async function parseWordFile(filePath: string, mimeType: string, linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    // 检查文件类型是否为 DOCX
    if (mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('不支持的文件类型，无法解析 Word 文件');
    }

    // 提取文件名
    const wordFileName = path.basename(filePath.replace(/^.*?_(.*)$/, '$1'));

    // 使用 docx4js 加载 DOCX 文件
    const docx = await docx4js.load(filePath);

    // 提取 DOCX 文件中的文本内容和表格
    let content = '';
    const tables: TableContent[] = [];

    // 遍历文档内容
    docx.officeDocument.content('w\\:t, w\\:tbl').each((index: number, node: any) => {
      if (node.name === 'w:t') {
        // 处理文本节点
        if (node.children && node.children.length > 0 && node.children[0].data) {
          content += node.children[0].data + '\n'; // 提取文本内容
        }
      } else if (node.name === 'w:tbl') {
        // 处理表格节点
        const table: TableRowContent[] = [];
        node.children.forEach((rowNode: any) => {
          if (rowNode.name === 'w:tr') {
            const row: TableCellContent[] = [];
            rowNode.children.forEach((cellNode: any) => {
              if (cellNode.name === 'w:tc') {
                let cellText = '';
                // 遍历单元格内容
                cellNode.children.forEach((cellContentNode: any) => {
                  if (cellContentNode.name === 'w:p') {
                    // 遍历段落内容
                    cellContentNode.children.forEach((paragraphNode: any) => {
                      if (paragraphNode.name === 'w:r') {
                        // 遍历文本运行内容
                        paragraphNode.children.forEach((textNode: any) => {
                          if (textNode.name === 'w:t') {
                            if (textNode.children && textNode.children[0].data) {
                              // 提取文本内容
                              cellText += textNode.children[0].data;
                            }
                          }
                        });
                      }
                    });
                  }
                });
                row.push({ text: cellText.trim() }); // 将单元格文本添加到行中
              }
            });
            table.push({ cells: row }); // 将行添加到表格中
          }
        });
        tables.push({ rows: table }); // 将表格添加到表格列表中
      }
    });

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
      fileName: wordFileName,
      mimeType,
      pages: pages,
      content: content,
      tables: tables, // 包含表格内容
    };
  } catch (error) {
    console.error('解析 Word 文件时出错:', error);
    throw new Error('解析 Word 文件失败');
  }
}

// 定义表格相关的类型
interface TableCellContent {
  text: string;
}

interface TableRowContent {
  cells: TableCellContent[];
}

interface TableContent {
  rows: TableRowContent[];
}

// 定义其他类型
interface LineContent {
  lineNumber: number;
  text: string;
}

interface PageContent {
  pageNumber: number;
  text: string;
  lines: LineContent[];
}

interface ParsedContent {
  fileName: string;
  mimeType: string;
  pages: PageContent[];
  content: string;
  tables: TableContent[];
}