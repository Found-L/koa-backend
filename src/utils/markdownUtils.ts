export function tableToMarkdown(table: any): string {
  if (!table || table.length === 0) return '';

  // 表头
  const header = table[0].join(' | ');
  const headerSeparator = table[0].map(() => '---').join(' | ');

  // 表格内容
  const rows = table.slice(1).map((row:any) => row.join(' | '));

  // 拼接 Markdown 表格
  return `
| ${header} |
| ${headerSeparator} |
${rows.map((row:any) => `| ${row} |`).join('\n')}
  `.trim();
}