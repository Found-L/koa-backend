// src/utils/fileParser.ts

import fs from 'fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import xlsx from 'xlsx';
import csvParse from 'csv-parse';
import { simpleParser } from 'mailparser';
import { parseStringPromise } from 'xml2js';
import epub from 'epub2';

import { parsePdfFile } from '../parsers/pdfParser';  // 引入 pdf 解析方法
import { parseWordFile } from '../parsers/docxParse'; // 导入 Word 解析方法
import { parseDocFile } from '../parsers/docParse'; // 导入 Word 解析方法
import { parseTextFile } from '../parsers/txtParse'; // 导入 txt 解析方法
import { parseMarkdownFile } from '../parsers/mdParse'; // 导入 Markdown 解析方法
import { parseHtmlFile } from '../parsers/htmlParse'; // 导入 HTML 解析方法
import { parseXlsxFile } from '../parsers/xlsxParse'; // 导入 xls xlsx 解析方法

import ParsedContent  from '../types/parsers'; // 导入 ParsedContent 类型

export async function parseFile(filePath: string, mimeType: string): Promise<ParsedContent | string> {
    try {
        const result: ParsedContent = {
            filePath,
            fileName: filePath.replace(/^.*?_(.*)$/, '$1'), // Get the file name from the path
            mimeType,
            pages: [],
            content: ''
        };

        // 处理 TXT 文件
        if (mimeType === 'text/plain') {
            const txtResult = await parseTextFile(filePath, mimeType); // 调用独立的 TXT 解析方法
            return {
                ...result,
                ...txtResult
            };
        }

        // 处理 PDF 文件
        if (mimeType === 'application/pdf') {
            const pdfResult = await parsePdfFile(filePath, mimeType); // 调用独立的 PDF 解析方法
            return {
                ...result,
                ...pdfResult
            };
        }

        // 处理 DOCX 文件
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const docxResult = await parseWordFile(filePath, mimeType); // 调用独立的 DOCX 解析方法
            return {
                ...result,
                ...docxResult
            };
        }

        // 处理 DOC 文件
        if (mimeType === 'application/msword') {
            const docResult = await parseDocFile(filePath, mimeType); // 调用独立的 DOC 解析方法
            return {
                ...result,
                ...docResult
            };
        }

        // 处理 Markdown 文件
        if (mimeType === 'text/markdown') {
        // if (mimeType === 'application/octet-stream') {
            const mdResult = await parseMarkdownFile(filePath, mimeType); // 调用独立的 Markdown 解析方法
            return {
                ...result,
                ...mdResult
            };
        }

        // 处理 HTML 文件
        if (mimeType === 'text/html') {
            const htmlResult = await parseHtmlFile(filePath, mimeType); // 调用独立的 HTML 解析方法
            return {
                ...result,
                ...htmlResult
            };
        }

        // 处理 XLSX 和 XLS 文件
        if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel') {
            const xlsxResult = await parseXlsxFile(filePath, mimeType); // 调用独立的 HTML 解析方法
            return {
                ...result,
                ...xlsxResult
            };
        }

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
