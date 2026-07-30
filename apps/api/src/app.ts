import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors);
  app.register(multipart);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
