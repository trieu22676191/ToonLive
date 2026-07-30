import "dotenv/config";
import { describe, expect, it } from "vitest";
import { extractTextBlocks } from "./ocr.service.js";
import { uploadFile } from "./storage.service.js";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

function toLargeBlankUrl(uploadedUrl: string): string {
  return uploadedUrl.replace("/upload/", "/upload/w_300,h_300,c_pad,b_white/");
}

describe("extractTextBlocks", () => {
  it("returns an empty array for an image with no text", async () => {
    const uploadedUrl = await uploadFile(ONE_PIXEL_PNG, `ocr-test-blank-${Date.now()}.png`);
    const imageUrl = toLargeBlankUrl(uploadedUrl);

    const blocks = await extractTextBlocks(imageUrl);

    expect(blocks).toEqual([]);
  });

  it("throws when OCR.space responds with a top-level error (e.g. missing apikey)", async () => {
    const originalKey = process.env.OCR_SPACE_API_KEY;
    process.env.OCR_SPACE_API_KEY = "";

    const imageUrl = await uploadFile(ONE_PIXEL_PNG, `ocr-test-no-key-${Date.now()}.png`);

    await expect(extractTextBlocks(imageUrl)).rejects.toThrow(/apikey/i);

    process.env.OCR_SPACE_API_KEY = originalKey;
  });
});
