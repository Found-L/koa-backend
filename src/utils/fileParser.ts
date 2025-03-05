// src/utils/fileParser.ts
import textract from "textract";
import ParsedContent  from '../types/parsers'; // 导入 ParsedContent 类型

export async function parseFile(filePath: string, mimeType: string): Promise<ParsedContent | string> {
    try {
        const result: ParsedContent = {
            fileName: filePath.replace(/^.*?_(.*)$/, '$1'), // Get the file name from the path
            mimeType,
            pages: [],
            content: ''
        };

        // 用 Promise 包装异步回调
        result.content = await new Promise<string>((resolve, reject) => {
            textract.fromFileWithPath(filePath, (error, text) => {
                if (error) {
                    reject(`解析失败: ${error}`);
                } else {
                    resolve(text || '');
                }
            });
        });

        // 如果文件类型不支持
        return result;
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }
}
