// src/parsers/docxParse.ts

import docx4js from 'docx4js';

export async function parseWordFile(filePath: string, mimeType: string, linesPerPage: number = 50): Promise<ParsedContent> {
  try {
    // 检查文件类型是否为 DOCX
    if (mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('不支持的文件类型，无法解析 Word 文件');
    }

    // 使用 docx4js 加载 DOCX 文件
    const docx = await docx4js.load(filePath);

    // 提取 DOCX 文件中的文本内容和表格
    let content = '';
    let lastRunParent: any = null; // 记录上一个 `w:t` 所属的 `w:r` 父节点

    // 遍历文档内容
    docx.officeDocument.content('w\\:t, w\\:tbl').each((index: number, node: any) => {
      if (node.name === 'w:t' && !isInsideTable(node)) {
        // 处理文本节点
        if (node.children && node.children.length > 0 && node.children[0].data) {
          const text = node.children[0].data;
          const currentRunParent = node.parent?.parent; // 获取 `w:r` 父级
          if (lastRunParent === currentRunParent) {
            // 如果当前 `w:t` 和上一个 `w:t` 属于同一个 `w:r`，拼接
            content += text;
          } else {
            // 否则，换行并添加新文本
            content += (content ? '\n' : '') + text;
          }

          lastRunParent = currentRunParent; // 更新最近的 `w:r` 父节点
        }
      } else if (node.name === 'w:tbl') {
        if (!content.endsWith('\n')) {
          content += '\n'; // 确保表格前有换行
        }

        // 处理表格节点
        const table: TableRowContent[] = [];

        const extractTextFromNode = (node: {
          name: string;
          children?: { data: string }[];
        }): string => {
          if (node.name === 'w:t' && node.children?.[0]?.data) {
            return node.children[0].data;
          }
          return '';
        };

        const extractCellContent = (cellNode: any): TableCellContent => {
          let cellText = '';

          cellNode.children?.forEach((cellContentNode: any) => {
            if (cellContentNode.name === 'w:p') {
              cellContentNode.children?.forEach((paragraphNode: any) => {
                if (paragraphNode.name === 'w:r') {
                  paragraphNode.children?.forEach((textNode: any) => {
                    cellText += extractTextFromNode(textNode);
                  });
                }
              });
            }
          });

          return { text: cellText.trim() };
        };

        const extractRowContent = (rowNode: any): TableRowContent => {
          const row: TableCellContent[] = rowNode.children
            ?.filter((cellNode: any) => cellNode.name === 'w:tc')
            .map(extractCellContent);

          return { cells: row };
        };

        node.children?.forEach((rowNode: any) => {
          if (rowNode.name === 'w:tr') {
            table.push(extractRowContent(rowNode));
          }
        });

        // 将表格转换为 Markdown 格式并插入到 content 中
        const markdownTable = convertTableToMarkdown(table);
        content += markdownTable + '\n';
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
      pages: pages,
      content: content,
    };
  } catch (error) {
    console.error('解析 Word 文件时出错:', error);
    throw new Error('解析 Word 文件失败');
  }
}

/**
 * 判断节点是否在表格内
 * @param node 当前节点
 * @returns 是否在表格内
 */
function isInsideTable(node: any): boolean {
  let parent = node.parent;
  while (parent) {
    if (parent.name === 'w:tbl') {
      return true; // 如果父节点是表格，返回 true
    }
    parent = parent.parent;
  }
  return false; // 否则返回 false
}

/**
 * 将表格数据转换为 Markdown 格式
 * @param table 表格数据
 * @returns Markdown 格式的表格字符串
 */
function convertTableToMarkdown(table: TableRowContent[]): string {
  let markdownTable = '';

  // 生成表头
  if (table.length > 0) {
    const header = table[0].cells.map(cell => cell.text).join(' | ');
    markdownTable += `| ${header} |\n`;

    // 生成分隔线
    const separator = table[0].cells.map(() => '---').join(' | ');
    markdownTable += `| ${separator} |\n`;

    // 生成表格内容
    for (let i = 1; i < table.length; i++) {
      const row = table[i].cells.map(cell => cell.text).join(' | ');
      markdownTable += `| ${row} |\n`;
    }
  }

  return markdownTable;
}

// 定义表格相关的类型（仅用于内部处理）
interface TableCellContent {
  text: string;
}

interface TableRowContent {
  cells: TableCellContent[];
}
