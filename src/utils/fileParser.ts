// src/utils/fileParser.ts
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import xlsx from 'xlsx';
import csvParse from 'csv-parse';
import { simpleParser } from 'mailparser';
import { parseStringPromise } from 'xml2js';
import epub from 'epub2';

import { parsePdfFile } from '../parsers/pdfParser';  // 引入 pdf 解析方法

import ParsedContent  from '../types/parsers'; // 导入 ParsedContent 类型

export async function parseFile(filePath: string, mimeType: string): Promise<ParsedContent | string> {
    try {
        const result: ParsedContent = {
            fileName: filePath.split('/').pop()!, // Get the file name from the path
            mimeType,
            pages: [],
            content: ''
        };

        // 处理 TXT 文件
        if (mimeType === 'text/plain') {
            result.content = await fs.readFile(filePath, 'utf-8');
            return result;
        }

        // 处理 PDF 文件
        // if (mimeType === 'application/pdf') {
        //     const data = await fs.readFile(filePath);
        //     const pdfData = await pdfParse(data);
        //     return pdfData.text;
        // }
        // 处理 PDF 文件
        if (mimeType === 'application/pdf') {
            const pdfResult = await parsePdfFile(filePath, mimeType); // 调用独立的 PDF 解析方法
            return pdfResult;
        }

        // 处理 DOCX 文件
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const data = await fs.readFile(filePath);
            const parsed = await mammoth.extractRawText({ buffer: data });
            result.content = parsed.value;
            return result;
        }

        // 处理 Markdown 文件
        // if (mimeType === 'text/markdown') {
        if (mimeType === 'application/octet-stream') {
            const markdownContent = await fs.readFile(filePath, 'utf-8');
            const parsed = await unified()
                .use(remarkParse)
                .use(remarkStringify)
                .process(markdownContent);
            result.content = parsed.toString();
            return result;
        }

        // // 处理 HTML 文件
        // if (mimeType === 'text/html') {
        //     // const htmlContent = await fs.readFile(filePath, 'utf-8');
        //     const htmlContent = iconv.decode(await fs.readFile(filePath), 'utf-8');
        //     try {
        //         const $ = cheerio.load(htmlContent);
        //         console.log('$:', $);
        //         return $('body').text(); // 提取 HTML 中的正文
        //     } catch (error) {
        //         console.error('Error loading HTML with cheerio:', error);
        //         throw new Error('Failed to parse HTML file');
        //     }
        // }

        // // 处理 XLSX 和 XLS 文件
        // if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        //     mimeType === 'application/vnd.ms-excel') {
        //     const data = await fs.readFile(filePath);
        //     const workbook = xlsx.read(data, { type: 'buffer' });
        //     const sheetName = workbook.SheetNames[0]; // 获取第一个 sheet
        //     const sheet = workbook.Sheets[sheetName];
        //     const json = xlsx.utils.sheet_to_json(sheet);
        //     return JSON.stringify(json, null, 2); // 将内容返回为 JSON 格式
        // }

        // // 处理 CSV 文件
        // if (mimeType === 'text/csv') {
        //     const data = await fs.readFile(filePath, 'utf-8');
        //     return new Promise((resolve, reject) => {
        //         csvParse(data, { columns: true, skip_empty_lines: true }, (err, output) => {
        //             if (err) reject(err);
        //             resolve(JSON.stringify(output, null, 2)); // 返回 CSV 解析后的 JSON
        //         });
        //     });
        // }

        // // 处理 EML 文件
        // if (mimeType === 'message/rfc822') {
        //     const data = await fs.readFile(filePath);
        //     const parsed = await simpleParser(data);
        //     return parsed.text; // 返回 EML 文件的文本内容
        // }

        // // 处理 MSG 文件
        // if (mimeType === 'application/vnd.ms-outlook') {
        //     const data = await fs.readFile(filePath);
        //     // 解析 MSG 文件，这里需要使用相应的库进行解析
        //     return 'MSG file parsing not implemented';
        // }

        // // 处理 XML 文件
        // if (mimeType === 'application/xml') {
        //     const data = await fs.readFile(filePath, 'utf-8');
        //     const parsed = await parseStringPromise(data);
        //     return JSON.stringify(parsed, null, 2); // 将 XML 转换为 JSON 字符串
        // }

        // // 处理 EPUB 文件
        // if (mimeType === 'application/epub+zip') {
        //     const epubFile = await fs.readFile(filePath);
        //     const epubData = await epub.parse(epubFile);
        //     return JSON.stringify(epubData, null, 2); // 返回 EPUB 的解析结果
        // }

        // 处理 PPTX 文件
        // if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        //     return 'PPTX file parsing not implemented'; // 需要特定库解析 PPTX 文件
        // }

        // 如果文件类型不支持
        return 'Unsupported file type';
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }
}
