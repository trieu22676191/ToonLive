import "dotenv/config";
import { describe, expect, it } from "vitest";
import { uploadFile } from "./storage.service.js";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("uploadFile", () => {
  it("uploads a buffer and returns a public URL", async () => {
    const url = await uploadFile(ONE_PIXEL_PNG, `test-${Date.now()}.png`);

    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });
});
