import { Server } from "@colyseus/http";
import { monitor } from "@colyseus/monitor";
import express from "express";

const port = Number(process.env.PORT || 2567);
const app = express();

const gameServer = new Server({
  server: app,
});

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);

// Register monitor endpoint
app.use("/colyseus", monitor());

// Basic health check
app.get("/", (req, res) => {
  res.sendStatus(200);
});