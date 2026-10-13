import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import express from "express";
import { GameConfig } from "packages/contracts";

const port = Number(process.env.PORT || 2567);
const app = express();

console.log("Starting SKYLINE server...");
console.log("Game Config:", {
  worldSize: 300,
  sectorSize: 100,
  maxPlayersPerSession: 8,
  physicsTickRate: 20,
  stateSendRate: 15
});

// Basic HTTP server for health checks and monitoring
app.get("/", (req, res) => {
  res.json({
    status: "online",
    game: "SKYLINE - Abidjan District",
    version: "0.1.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Create Colyseus server
const gameServer = new Server({
  server: app,
});

// Register monitor endpoint for development/admin
app.use("/colyseus", monitor());

// Start listening
gameServer.listen(port);
console.log(`SKYLINE server listening on ws://localhost:${port}`);
console.log(`Monitor available at http://localhost:${port}/colyseus`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  gameServer.shutdown().then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  gameServer.shutdown().then(() => {
    process.exit(0);
  });
});