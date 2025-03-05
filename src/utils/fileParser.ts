// src/utils/fileParser.ts

import { Document } from '@llamaindex/core/schema';
import { CSVReader } from '@llamaindex/readers/csv';
import { PDFReader } from '@llamaindex/readers/pdf';
import { JSONReader } from '@llamaindex/readers/json';
import { MarkdownReader } from '@llamaindex/readers/markdown';
import { HTMLReader } from '@llamaindex/readers/html';
import { TextFileReader } from '@llamaindex/readers/text';
import { DocxReader } from '@llamaindex/readers/docx';

import { SentenceSplitter } from 'llamaindex';
import { Settings } from 'llamaindex';


// **全局设置 SentenceSplitter**
const nodeParser = new SentenceSplitter(
    {
        chunkSize: 256, // 限制每个块最多 256 个 token
        chunkOverlap: 50, // 保证块之间有 50 个 token 的重叠，提高语义连续性
        separator: '.', // 以句号（"."）为主要分隔符
        paragraphSeparator: '\n\n', // 以两个换行符作为段落分隔
        secondaryChunkingRegex: '[.!?]', // 备用句子分割正则（句号、感叹号、问号）
    }
);
Settings.nodeParser = nodeParser;

export async function parseFile(filePath: string, mimeType: string): Promise<Document[] | string[] | string> {
    try {
        let documents: Document[];

        if (mimeType === 'text/plain') {
            const reader = new TextFileReader();
            documents = await reader.loadData(filePath);
        } else if (mimeType === 'application/pdf') {
            const reader = new PDFReader();
            documents = await reader.loadData(filePath);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const reader = new DocxReader();
            documents = await reader.loadData(filePath);
        } else if (mimeType === 'text/markdown') {
            const reader = new MarkdownReader();
            documents = await reader.loadData(filePath);
        } else if (mimeType === 'text/html') {
            const reader = new HTMLReader();
            documents = await reader.loadData(filePath);
        } else if (mimeType === 'text/csv') {
            const reader = new CSVReader();
            documents = await reader.loadData(filePath);
        } else {
            return 'Unsupported file type';
        }

        console.log("documents", documents)
        // **使用 SentenceSplitter 对解析结果进行拆分**
        // const splitDocuments = documents.flatMap(doc => Settings.nodeParser.split(doc.text));
        // const splitDocuments = documents.flatMap(async doc => await Settings.nodeParser.split(doc.text));
        const splitDocuments = documents.flatMap(doc => {
            return nodeParser.splitText(doc.text);
        });


        return splitDocuments;
        // // 处理 XLSX 和 XLS 文件
        // if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        // }

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
        // return 'Unsupported file type';
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }
}
