"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { TaskItem, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { Plus, Circle, Clock, CheckCircle2, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface KanbanBoardProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  onAddTask: (status: TaskStatus) => void;
  onTaskMoved: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
}

const COLUMNS: { id: TaskStatus; label: string; icon: any; color: string; border: string; bg: string }[] = [
  {
    id: "TODO",
    label: "To Do",
    icon: Circle,
    color: "text-slate-500",
    border: "border-slate-300 dark:border-slate-700",
    bg: "bg-slate-100/60 dark:bg-slate-900/40",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
    border: "border-blue-400 dark:border-blue-700",
    bg: "bg-blue-50/40 dark:bg-blue-950/20",
  },
  {
    id: "IN_REVIEW",
    label: "In Review",
    icon: HelpCircle,
    color: "text-amber-500",
    border: "border-amber-400 dark:border-amber-700",
    bg: "bg-amber-50/40 dark:bg-amber-950/20",
  },
  {
    id: "DONE",
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-500",
    border: "border-emerald-400 dark:border-emerald-700",
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
  },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
  onAddTask,
  onTaskMoved,
}: KanbanBoardProps) {
  const [boardTasks, setBoardTasks] = useState<TaskItem[]>(tasks);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const taskToMove = boardTasks.find((t) => t.id === draggableId);
    if (!taskToMove) return;

    // Fire celebration confetti if moved to DONE!
    if (destStatus === "DONE" && sourceStatus !== "DONE") {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#14b8a6", "#10b981", "#3b82f6"],
      });
    }

    // Get current tasks in destination column (excluding the dragged task)
    const otherTasksInDest = boardTasks
      .filter((t) => t.status === destStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    // Insert taskToMove at destination.index
    const updatedTask = { ...taskToMove, status: destStatus };
    otherTasksInDest.splice(destination.index, 0, updatedTask);

    // Re-index all tasks in destination column with sequential distinct orders
    const reindexedDestTasks = otherTasksInDest.map((t, idx) => ({
      ...t,
      order: idx,
    }));

    // Other tasks not in destination column
    const otherTasksOutsideDest = boardTasks.filter(
      (t) => t.status !== destStatus && t.id !== draggableId
    );

    // If source column is different, re-index source column tasks as well
    let finalBoardTasks: TaskItem[];
    if (sourceStatus !== destStatus) {
      const sourceTasks = otherTasksOutsideDest
        .filter((t) => t.status === sourceStatus)
        .sort((a, b) => a.order - b.order)
        .map((t, idx) => ({ ...t, order: idx }));

      const remainingOthers = otherTasksOutsideDest.filter(
        (t) => t.status !== sourceStatus
      );

      finalBoardTasks = [...remainingOthers, ...sourceTasks, ...reindexedDestTasks];
    } else {
      finalBoardTasks = [...otherTasksOutsideDest, ...reindexedDestTasks];
    }

    setBoardTasks(finalBoardTasks);

    // Notify backend
    onTaskMoved(draggableId, destStatus, destination.index);
  };

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pb-6">
        {COLUMNS.map((col) => {
          const colTasks = boardTasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.order - b.order);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className={`rounded-2xl p-3.5 flex flex-col border border-slate-200 dark:border-slate-800/80 ${col.bg} transition-colors min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {col.label}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onAddTask(col.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-800 transition shadow-none hover:shadow-sm"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Droppable Column Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 flex flex-col gap-2.5 rounded-xl p-1 transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-teal-500/10 ring-2 ring-teal-500/30 ring-dashed"
                        : ""
                    }`}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(dragProvided) => (
                          <TaskCard
                            task={task}
                            onClick={onTaskClick}
                            provided={dragProvided}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colTasks.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 dark:text-slate-600">
                        <p className="text-xs italic">No tasks here</p>
                        <button
                          onClick={() => onAddTask(col.id)}
                          className="mt-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add a task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
