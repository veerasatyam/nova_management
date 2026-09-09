"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineCount: number;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  emitTaskMoved: (data: { projectId: string; taskId: string; newStatus: string; newOrder: number }) => void;
  emitTaskCreated: (data: { projectId: string; task: any }) => void;
  emitTaskUpdated: (data: { projectId: string; taskId: string; task: any }) => void;
  emitSubtaskToggled: (data: { projectId: string; subtaskId: string; completed: boolean }) => void;
  emitCommentAdded: (data: { projectId: string; taskId: string; comment: any }) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineCount: 1,
  joinProject: () => {},
  leaveProject: () => {},
  emitTaskMoved: () => {},
  emitTaskCreated: () => {},
  emitTaskUpdated: () => {},
  emitSubtaskToggled: () => {},
  emitCommentAdded: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    // Connect to same origin
    const socketInstance = io({
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 [WebSocket] Connected to real-time server:", socketInstance.id);
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("🔴 [WebSocket] Disconnected from server");
      setConnected(false);
    });

    socketInstance.on("users:online", (count: number) => {
      setOnlineCount(count);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinProject = (projectId: string) => {
    if (socket && connected) {
      socket.emit("project:join", projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (socket && connected) {
      socket.emit("project:leave", projectId);
    }
  };

  const emitTaskMoved = (data: { projectId: string; taskId: string; newStatus: string; newOrder: number }) => {
    if (socket && connected) {
      socket.emit("task:moved", data);
    }
  };

  const emitTaskCreated = (data: { projectId: string; task: any }) => {
    if (socket && connected) {
      socket.emit("task:created", data);
    }
  };

  const emitTaskUpdated = (data: { projectId: string; taskId: string; task: any }) => {
    if (socket && connected) {
      socket.emit("task:updated", data);
    }
  };

  const emitSubtaskToggled = (data: { projectId: string; subtaskId: string; completed: boolean }) => {
    if (socket && connected) {
      socket.emit("subtask:toggled", data);
    }
  };

  const emitCommentAdded = (data: { projectId: string; taskId: string; comment: any }) => {
    if (socket && connected) {
      socket.emit("comment:added", data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineCount,
        joinProject,
        leaveProject,
        emitTaskMoved,
        emitTaskCreated,
        emitTaskUpdated,
        emitSubtaskToggled,
        emitCommentAdded,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
