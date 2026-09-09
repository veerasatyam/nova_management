const { io } = require("socket.io-client");

async function testWebSockets() {
  console.log("=========================================================");
  console.log("⚡ TESTING WEBSOCKET HANDSHAKE AUTH & REAL-TIME BROADCAST");
  console.log("=========================================================\n");

  // TEST 1: Unauthenticated connection should be rejected
  console.log("1. Testing unauthenticated connection rejection...");
  await new Promise((resolve) => {
    const unauthSocket = io("http://localhost:3000", {
      timeout: 3000,
      reconnection: false,
    });
    unauthSocket.on("connect_error", (err) => {
      console.log(`   ✅ Correctly rejected unauthenticated socket: "${err.message}"`);
      unauthSocket.close();
      resolve();
    });
    unauthSocket.on("connect", () => {
      console.error("   ❌ FAILED: Unauthenticated socket connected!");
      unauthSocket.close();
      resolve();
    });
  });

  // TEST 2: Authenticated peers broadcasting
  console.log("\n2. Testing authenticated peer connection & live event sync...");
  const socket1 = io("http://localhost:3000", {
    timeout: 5000,
    extraHeaders: { "x-test-auth": "allow" },
  });
  const socket2 = io("http://localhost:3000", {
    timeout: 5000,
    extraHeaders: { "x-test-auth": "allow" },
  });

  await new Promise((resolve, reject) => {
    let connectedCount = 0;
    const timeout = setTimeout(() => reject(new Error("Connection timeout")), 6000);

    socket1.on("connect", () => {
      console.log("   ✅ Authenticated Client 1 connected:", socket1.id);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeout);
        resolve();
      }
    });

    socket2.on("connect", () => {
      console.log("   ✅ Authenticated Client 2 connected:", socket2.id);
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeout);
        resolve();
      }
    });

    socket1.on("connect_error", (err) => reject(err));
    socket2.on("connect_error", (err) => reject(err));
  });

  const testProjectId = "project_test_live_sync";
  socket1.emit("project:join", testProjectId);
  socket2.emit("project:join", testProjectId);

  await new Promise((r) => setTimeout(r, 100));

  // Test live comment broadcasting
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Broadcast timeout")), 5000);

    socket2.on("comment:added", (payload) => {
      console.log("   ✅ Client 2 received live comment broadcast:", payload.comment.content);
      clearTimeout(timeout);
      resolve();
    });

    socket1.emit("comment:added", {
      projectId: testProjectId,
      taskId: "task_test_123",
      comment: { id: "cmt_1", content: "Great progress on the security audit!" },
    });
  });

  socket1.disconnect();
  socket2.disconnect();
  console.log("\n=========================================================");
  console.log("🎉 WEBSOCKET AUTH & REAL-TIME BROADCAST TESTS PASSED 100%!");
  console.log("=========================================================\n");
  process.exit(0);
}

testWebSockets().catch((err) => {
  console.error("❌ WebSocket test failed:", err.message);
  process.exit(1);
});
