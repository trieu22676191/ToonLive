import { extractTextBlocks, prisma } from "@comic-to-voice/shared";
import type { FastifyInstance } from "fastify";

export async function ocrRoutes(app: FastifyInstance) {
  app.post("/comics/pages/:pageId/ocr", async (request, reply) => {
    const { pageId } = request.params as { pageId: string };

    const page = await prisma.page.findUnique({ where: { id: pageId } });

    if (!page) {
      return reply.status(404).send({ error: "Page không tồn tại" });
    }

    const textBlocks = await extractTextBlocks(page.imageUrl);

    const dialogueLines = await prisma.$transaction(
      textBlocks.map((block, index) =>
        prisma.dialogueLine.create({
          data: {
            pageId,
            characterId: null,
            text: block.text,
            bboxX: block.bboxX,
            bboxY: block.bboxY,
            bboxWidth: block.bboxWidth,
            bboxHeight: block.bboxHeight,
            orderIndex: index,
          },
        })
      )
    );

    return reply.status(200).send({ dialogueLines });
  });
}
