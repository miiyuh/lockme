import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fileRoutes from "./routes/fileRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add API routes
  app.use("/api", fileRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
