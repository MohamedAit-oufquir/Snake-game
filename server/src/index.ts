import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT || 3000;

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, "../../client/dist")));

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Handles any requests that don't match the ones above
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
