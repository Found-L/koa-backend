import fs from "fs";
const PPTX2Json = require("pptx2json");
const pptx2json = new PPTX2Json();

export async function parsePptxFile(filePath: string, mimeType: string): Promise<ParsedContent> {
  try {
    if (mimeType !== "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      throw new Error("不支持的文件类型，无法解析 PPTX 文件");
    }

    if (!fs.existsSync(filePath)) {
      throw new Error("文件不存在：" + filePath);
    }

    // 解析 PPTX
    const pptData = await pptx2json.toJson(filePath);

    let pages: PageContent[] = [];
    let allText: string[] = []; // 用于拼接 content

    // **按 slide 文件名排序**
    const slideEntries = Object.entries(pptData)
      .filter(([key]) => key.startsWith("ppt/slides/slide") && !key.includes("_rels"))
      .sort(([a], [b]) => {
        // 提取 slide 数字，例如 slide1.xml -> 1，slide10.xml -> 10
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
        return numA - numB; // 确保 slide1 在 slide2 之前
      });

    // **顺序遍历 slides**
    slideEntries.forEach(([key, slideData], index) => {
      const slideText = extractTextFromSlideObject(slideData, pptData);
      allText.push(slideText); // 记录整体文本内容

      // 计算行数
      const lines = slideText.split("\n").map((line, lineNumber) => ({
        lineNumber: lineNumber + 1,
        text: line,
      }));

      // **按正确顺序构造 PageContent**
      pages.push({
        pageNumber: index + 1, // **严格按照排序后的索引作为页码**
        text: slideText,
        lines,
      });
    });

    // 拼接所有文本作为 content
    const content = allText.join("\n");

    return { pages, content };
  } catch (error) {
    console.error("解析 PPTX 文件失败:", error);
    throw new Error("解析 PPTX 文件失败");
  }
}

const extractTextFromSlideObject = (slideData: any, pptData?: any): string => {
  let paragraphs: string[] = [];

  const extractText = (node: any): string[] => {
    let currentParagraph: string[] = [];

    if (typeof node === "object" && node !== null) {
      if (Array.isArray(node)) {
        node.forEach((child) => {
          currentParagraph.push(...extractText(child)); // 递归处理子元素
        });
      } else {
        Object.entries(node).forEach(([key, value]) => {
          if (key === "a:t" && Array.isArray(value)) {
            currentParagraph.push(...value); // 处理文本
          } else if (key === "a:p") {
            // 处理段落
            let newParagraph = extractText(value);
            if (newParagraph.length > 0) {
              paragraphs.push(newParagraph.join("")); // 合并当前段落
            }
          } else if (key === "a:tbl") {
            // 处理表格
            const markdownTable = extractTableToMarkdown(value);
            paragraphs.push(markdownTable); // 加入 Markdown 表格
          } else if (key === "c:chart") {
            // 处理图表
            const chartMarkdown = extractChartToMarkdown(value, pptData);
            paragraphs.push(chartMarkdown); // 加入图表描述
          } else {
            currentParagraph.push(...extractText(value)); // 递归处理其他类型的节点
          }
        });
      }
    }

    return currentParagraph; // 返回当前处理的段落文本
  };

  extractText(slideData);
  return paragraphs.join("\n"); // 以换行符分隔段落
};


// 处理表格并转换为 Markdown 格式
const extractTableToMarkdown = (tableNode: any): string => {
  let tableMarkdown: string[][] = [];

  if (!Array.isArray(tableNode) || tableNode.length === 0) return "";

  // 遍历 tableNode 中的每个对象
  tableNode.forEach((node: any) => {
    // 获取每一行（a:tr）
    const rows = node["a:tr"];
    if (Array.isArray(rows)) {
      rows.forEach((row: any) => {
        let rowMarkdown: string[] = [];

        // 处理每一行中的单元格（a:tc）
        if (Array.isArray(row["a:tc"])) {
          row["a:tc"].forEach((cell: any) => {
            const cellText = extractTextFromSlideObject(cell["a:txBody"] || {});
            rowMarkdown.push(cellText); // 处理单元格文本
          });
        }

        tableMarkdown.push(rowMarkdown);
      });
    }
  });

  // 生成 Markdown 格式的表格
  const markdownString = tableMarkdown
    .map((row, idx) =>
      idx === 0
        ? `| ${row.join(" | ")} |\n| ${row.map(() => "---").join(" | ")} |`
        : `| ${row.join(" | ")} |`
    )
    .join("\n");

  return markdownString;
};

// 处理图表并转换为 Markdown 格式
const extractChartToMarkdown = (chartNode: any, pptData: any): string => {
  let chartMarkdown: string[] = [];

  if (!chartNode || typeof chartNode !== "object" || chartNode.length === 0) return "";

  chartNode.forEach((node: any) => {
    const chartId = node["$"]?.["r:id"] || "未知ID";

    // 查找图表 XML
    const findChartRel = (obj: any, chartId: string): { Target?: string } | undefined => {
      if (!obj || typeof obj !== "object") return undefined;

      // 如果当前对象具有 `Id` 并且匹配 `chartId`
      if (
        obj.Id === chartId &&
        typeof obj.Type === "string" &&
        /\/relationships\/chart$/.test(obj.Type) // 使用正则表达式确保 chart 是结尾
      ) {
        return obj as { Target?: string };
      }

      // 递归搜索所有键的值
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const result = findChartRel(obj[key], chartId);
          if (result) return result;
        }
      }

      return undefined;
    };

    const chartRel = findChartRel(pptData, chartId);
    console.log('chartRel', chartRel)

    if (!chartRel || !chartRel.Target) {
      chartMarkdown.push(`未找到对应的图表 XML`);
      return;
    }

    const chartPath = chartRel.Target.replace(/^..\//, "ppt/");
    console.log('chartPath', chartPath)

    const chartXml = pptData[chartPath];
    console.log('chartXml', chartXml)

    if (!chartXml) {
      chartMarkdown.push(`图表文件缺失: ${chartPath}`);
      return;
    }

    // 获取图表标题
    const getTitleText = (xml: any): string | null => {
      const titleNode = xml["c:chart"]?.[0]?.["c:title"];
      if (titleNode) {
        const titleText = titleNode[0]?.["c:tx"]?.[0]?.["c:strRef"]?.[0]?.["c:strCache"]?.[0]?.["c:pt"]?.[0]?.["c:v"];
        return titleText || null;
      }
      return null;
    };

        // 获取图表数据
    const getPlotAreaData = (xml: any): any[] => {
      const plotArea = xml["c:chart"]?.[0]?.["c:plotArea"]?.[0];
      if (!plotArea) return [];

      const chartTypes = ["c:barChart", "c:lineChart", "c:pieChart", "c:scatterChart", "c:areaChart"];
      for (const type of chartTypes) {
        if (plotArea[type]) {
          return plotArea[type][0]?.["c:ser"] || [];
        }
      }
      return [];
    };

    let titleText,
        seriesNodes: any[] | undefined;

    Object.entries(chartXml).forEach(([key, value]) => {
      titleText = getTitleText(value);
      seriesNodes = getPlotAreaData(value);
    });

    if (titleText) {
      chartMarkdown.push(`**图表标题**: ${titleText}`);
    }

    if (!seriesNodes) {
      chartMarkdown.push(`未找到图表数据`);
      return;
    }

    let tableData: string[][] = [];

    // 提取类别（X 轴数据）
    const categories = seriesNodes[0]?.["c:cat"]?.[0]?.["c:strRef"]?.[0]?.["c:strCache"]?.[0]?.["c:pt"] as any[];
    const categoryLabels: string[] = categories.map((cat) => cat["c:v"] as string);

    // 构建 Markdown 表格的表头
    const headerRow = ["类别"];
    const seriesData: string[][] = categoryLabels.map(label => [label]);

    seriesNodes.forEach((series, index) => {
      const seriesName = series["c:tx"]?.[0]?.["c:strRef"]?.[0]?.["c:strCache"]?.[0]?.["c:pt"]?.[0]?.["c:v"] || `系列 ${index + 1}`;
      headerRow.push(seriesName);

      const values = series["c:val"]?.[0]?.["c:numRef"]?.[0]?.["c:numCache"]?.[0]?.["c:pt"] || [];
      const valueNumbers = values.map((val: any) => val["c:v"]) || [];

      valueNumbers.forEach((value: string, i: number) => {
        if (seriesData[i]) {
          seriesData[i].push(value);
        }
      });
    });

    // 组装 Markdown 表格数据
    tableData.push(headerRow);
    tableData.push([...headerRow.map(() => "---")]); // 表头和分隔符
    tableData.push(...seriesData);

    // 转换为 Markdown 格式
    const markdownTable = tableData.map(row => `| ${row.join(" | ")} |`).join("\n");

    chartMarkdown.push(markdownTable);
  });

  return chartMarkdown.join("\n\n");
};
