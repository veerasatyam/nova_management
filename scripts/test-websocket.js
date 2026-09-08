const { io } = require("socket.io-client");

async function testWebSockets() {
  console.log("Testing WebSocket connection to http://localhost:3000...");

  const socket1 = io("http://localhost:3000", { timeout: 5000 });
  const socket2 = io("http://localhost:3000", { timeout: 5000 });

  await new Promise((resolve, reject) => {
    let connectedCount = 0;
    const timeout = setTimeout(() => reject(new Error("Connection timeout")), 6000);

    socket1.on("connect", () => {
      console.log("✅ Client 1 connected successfully:", socket1.id);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeout);
        resolve();
      }
    });

    socket2.on("connect", () => {
      console.log("✅ Client 2 connected successfully:", socket2.id);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeout);
        resolve();
      }
    });

    socket1.on("connect_error", (err) => reject(err));
    socket2.on("connect_error", (err) => reject(err));
  });

  // Test rooms and message passing
  console.log("Testing real-time event broadcasting between peers...");
  const testProjectId = "project_test_123";

  socket1.emit("project:join", testProjectId);
  socket2.emit("project:join", testProjectId);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Broadcast timeout")), 5000);

    socket2.on("task:moved", (payload) => {
      console.log("✅ Client 2 received live task move event:", payload);
      clearTimeout(timeout);
      resolve();
    });

    // Client 1 emits task:moved
    socket1.emit("task:moved", {
      projectId: testProjectId,
      taskId: "task_456",
      newStatus: "DONE",
      newOrder: 2,
    });
  });

  socket1.disconnect();
  socket2.disconnect();
  console.log("\n🎉 REAL-TIME WEBSOCKETS BROADCASTING PASSED PERFECTLY!\n");
  process.exit(0);
}

testWebSockets().catch((err) => {
  console.error("❌ WebSocket test failed:", err.message);
  process.exit(1);
});
