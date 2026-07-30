import { groupLinesIntoBlocks } from "./ocr-grouping.js";

export interface TextBlock {
  text: string;
  bboxX: number;
  bboxY: number;
  bboxWidth: number;
  bboxHeight: number;
}

interface OcrSpaceWord {
  WordText: string;
  Left: number;
  Top: number;
  Height: number;
  Width: number;
}

interface OcrSpaceLine {
  LineText: string;
  Words: OcrSpaceWord[];
}

interface OcrSpaceParsedResult {
  TextOverlay?: { Lines: OcrSpaceLine[] };
}

interface OcrSpaceResponse {
  ParsedResults?: OcrSpaceParsedResult[];
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  error?: string;
}

function lineToTextBlock(line: OcrSpaceLine): TextBlock {
  const lefts = line.Words.map((w) => w.Left);
  const tops = line.Words.map((w) => w.Top);
  const rights = line.Words.map((w) => w.Left + w.Width);
  const bottoms = line.Words.map((w) => w.Top + w.Height);

  const bboxX = Math.min(...lefts);
  const bboxY = Math.min(...tops);
  const bboxWidth = Math.max(...rights) - bboxX;
  const bboxHeight = Math.max(...bottoms) - bboxY;

  return { text: line.LineText, bboxX, bboxY, bboxWidth, bboxHeight };
}

export async function extractTextBlocks(imageUrl: string): Promise<TextBlock[]> {
  const apiKey = process.env.OCR_SPACE_API_KEY ?? "";

  const params = new URLSearchParams({
    apikey: apiKey,
    url: imageUrl,
    language: "vnm",
    OCREngine: "2",
    isOverlayRequired: "true",
  });

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = (await response.json()) as OcrSpaceResponse;

  if (data.error) {
    throw new Error(`OCR.space error: ${data.error}`);
  }

  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join("; ") : data.ErrorMessage;
    throw new Error(`OCR.space error: ${message}`);
  }

  const lines = data.ParsedResults?.[0]?.TextOverlay?.Lines ?? [];
  const textBlocks = lines.filter((line) => line.Words.length > 0).map(lineToTextBlock);

  return groupLinesIntoBlocks(textBlocks);
}
