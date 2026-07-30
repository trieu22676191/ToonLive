import "dotenv/config";
import { prisma, uploadFile } from "@comic-to-voice/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("POST /comics/pages/:pageId/ocr", () => {
  const app = buildApp();
  let userId: string;
  let comicId: string;
  let pageId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `ocr-test-${Date.now()}@example.com`, password: "hashed-password" },
    });
    userId = user.id;
    const comic = await prisma.comic.create({ data: { userId, title: "OCR Test Comic" } });
    comicId = comic.id;
    const uploadedUrl = await uploadFile(ONE_PIXEL_PNG, `ocr-route-test-${Date.now()}.png`);
    const imageUrl = uploadedUrl.replace("/upload/", "/upload/w_300,h_300,c_pad,b_white/");
    const page = await prisma.page.create({ data: { comicId, pageNumber: 1, imageUrl } });
    pageId = page.id;
  });

  afterAll(async () => {
    await prisma.dialogueLine.deleteMany({ where: { pageId } });
    await prisma.page.delete({ where: { id: pageId } });
    await prisma.comic.delete({ where: { id: comicId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("runs OCR on the page and saves DialogueLine records", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/comics/pages/${pageId}/ocr`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body.dialogueLines)).toBe(true);

    const saved = await prisma.dialogueLine.findMany({ where: { pageId } });
    expect(saved.length).toBe(body.dialogueLines.length);
  });
});
