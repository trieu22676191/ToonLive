import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { ocrRoutes } from "./routes/ocr.js";
import { pagesRoutes } from "./routes/pages.js";

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors);
  app.register(multipart);
  app.register(pagesRoutes);
  app.register(ocrRoutes);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
