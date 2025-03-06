// src/types/parsers.d.ts
declare global {
  interface ParsedContent {
    fileName?: string;
    filePath?: string;
    mimeType?: string;
    pages: PageContent[];
    content: string;
  }

  interface PageContent {
    pageNumber: number;
    text: string;
    lines: LineContent[];
  }

  interface LineContent {
    lineNumber: number;
    text: string;
  }
}
export {};