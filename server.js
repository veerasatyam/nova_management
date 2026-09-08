require("dotenv").config();
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the HTTP server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track connected users
  let activeUsersCount = 0;

  io.on("connection", (socket) => {
    activeUsersCount++;
    io.emit("users:online", activeUsersCount);
    console.log(`🔌 [WebSocket] Client connected: ${socket.id} (Active: ${activeUsersCount})`);

    // Join specific project room for targeted live updates
    socket.on("project:join", (projectId) => {
      socket.join(projectId);
      console.log(`📌 [WebSocket] Client ${socket.id} joined project room: ${projectId}`);
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(projectId);
      console.log(`👋 [WebSocket] Client ${socket.id} left project room: ${projectId}`);
    });

    // Broadcast real-time Kanban moves to all peers in the project
    socket.on("task:moved", (data) => {
      console.log(`⚡ [WebSocket] Task moved:`, data);
      socket.to(data.projectId).emit("task:moved", data);
      socket.broadcast.emit("dashboard:refresh");
    });

    // Broadcast new task created
    socket.on("task:created", (data) => {
      console.log(`⚡ [WebSocket] Task created:`, data);
      socket.to(data.projectId).emit("task:created", data);
      socket.broadcast.emit("dashboard:refresh");
    });

    // Broadcast task updated (e.g. status, assignee, priority)
    socket.on("task:updated", (data) => {
      console.log(`⚡ [WebSocket] Task updated:`, data);
      socket.to(data.projectId).emit("task:updated", data);
      socket.broadcast.emit("dashboard:refresh");
    });

    // Broadcast subtask toggled
    socket.on("subtask:toggled", (data) => {
      console.log(`⚡ [WebSocket] Subtask toggled:`, data);
      socket.to(data.projectId).emit("subtask:toggled", data);
    });

    // Broadcast comment posted
    socket.on("comment:added", (data) => {
      console.log(`⚡ [WebSocket] Comment added:`, data);
      socket.to(data.projectId).emit("comment:added", data);
    });

    socket.on("disconnect", () => {
      activeUsersCount = Math.max(0, activeUsersCount - 1);
      io.emit("users:online", activeUsersCount);
      console.log(`🔌 [WebSocket] Client disconnected: ${socket.id} (Active: ${activeUsersCount})`);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> 🚀 NOVA Server running on http://${hostname}:${port} with Real-Time WebSockets enabled!`);
  });
});
