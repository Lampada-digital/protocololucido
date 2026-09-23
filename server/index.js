import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { LucidRoom } from "./rooms/LucidRoom.js";

const port = process.env.PORT || 2567;
const app = express();

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({ server });

// Register game room
gameServer.define("lucid", LucidRoom);

// Start server
gameServer.listen(port);
console.log(`[Lucid Protocol] Server listening on ws://localhost:${port}`);
console.log(`[Lucid Protocol] Health check: http://localhost:${port}/health`);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Lucid Protocol] Shutting down...");
  gameServer.gracefullyShutdown();
});
