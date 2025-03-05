// src/utils/fileParser.ts

import { Document } from '@llamaindex/core/schema';
import { CSVReader } from '@llamaindex/readers/csv';
import { PDFReader } from '@llamaindex/readers/pdf';
import { JSONReader } from '@llamaindex/readers/json';
import { MarkdownReader } from '@llamaindex/readers/markdown';
import { HTMLReader } from '@llamaindex/readers/html';
import { TextFileReader } from '@llamaindex/readers/text';
import { DocxReader } from '@llamaindex/readers/docx';

export async function parseFile(filePath: string, mimeType: string): Promise<Document[] | string> {
    try {
        // 处理 TXT 文件
        if (mimeType === 'text/plain') {
            const reader = new TextFileReader();
            return await reader.loadData(filePath);
        }

        // 处理 PDF 文件
        if (mimeType === 'application/pdf') {
            // const pdfResult = await parsePdfFile(filePath, mimeType); // 调用独立的 PDF 解析方法
            const reader = new PDFReader();
            return await reader.loadData(filePath);
        }

        // 处理 DOCX 文件
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const reader = new DocxReader();
            return await reader.loadData(filePath);
        }

        // 处理 Markdown 文件
        if (mimeType === 'text/markdown') {
            const reader = new MarkdownReader();
            return await reader.loadData(filePath);
        }

        // 处理 HTML 文件
        if (mimeType === 'text/html') {
            const reader = new HTMLReader();
            return await reader.loadData(filePath);
        }

        // // 处理 XLSX 和 XLS 文件
        // if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        // }

        // 处理 CSV 文件
        if (mimeType === 'text/csv') {
            const reader = new CSVReader();
            return await reader.loadData(filePath);
        }

        // // 处理 EML 文件
        // if (mimeType === 'message/rfc822') {
        // }

        // // 处理 MSG 文件
        // if (mimeType === 'application/vnd.ms-outlook') {
        // }

        // // 处理 XML 文件
        // if (mimeType === 'application/xml') {
        // }

        // // 处理 EPUB 文件
        // if (mimeType === 'application/epub+zip') {
        // }

        // 处理 PPTX 文件
        // if (mimeType === 'application/vnd.openxmlformats-officedocument.
        // }

        // 如果文件类型不支持
        return 'Unsupported file type';
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }
}
