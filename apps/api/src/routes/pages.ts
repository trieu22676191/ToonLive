import { prisma, uploadFile } from "@comic-to-voice/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const pageNumberSchema = z.coerce.number().int().positive();

export async function pagesRoutes(app: FastifyInstance) {
  app.post("/comics/:comicId/pages", async (request, reply) => {
    const { comicId } = request.params as { comicId: string };

    const file = await request.file({
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    });

    if (!file) {
      return reply.status(400).send({ error: "Thiếu file ảnh" });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({ error: "Chỉ chấp nhận .jpg/.png/.webp" });
    }

    // Phải đọc hết file trước khi field.fields chứa các field gửi sau file
    // trong cùng multipart request (busboy chỉ tiếp tục parse sau khi file
    // stream được tiêu thụ hết).
    const fileBuffer = await file.toBuffer();

    if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return reply.status(400).send({ error: "File vượt quá 10MB" });
    }

    const pageNumberField = file.fields.pageNumber;
    const pageNumberValue =
      pageNumberField && "value" in pageNumberField ? pageNumberField.value : undefined;
    const pageNumberResult = pageNumberSchema.safeParse(pageNumberValue);

    if (!pageNumberResult.success) {
      return reply.status(400).send({ error: "pageNumber không hợp lệ" });
    }

    const imageUrl = await uploadFile(fileBuffer, `${comicId}-${Date.now()}-${file.filename}`);

    const page = await prisma.page.create({
      data: {
        comicId,
        pageNumber: pageNumberResult.data,
        imageUrl,
      },
    });

    return reply.status(201).send(page);
  });
}
