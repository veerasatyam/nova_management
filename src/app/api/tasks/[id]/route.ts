import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  order: z.number().optional(),
  tags: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, title: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, key: true, color: true },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validated = updateTaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = { ...validated.data };
    if (updateData.dueDate !== undefined) {
      updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
        subtasks: true,
      },
    });

    // Generate Activity Log if status or priority or assignee changed
    let logMessage = "";
    if (updateData.status && updateData.status !== existingTask.status) {
      logMessage = `Changed status from ${existingTask.status} to ${updateData.status}`;
    } else if (updateData.priority && updateData.priority !== existingTask.priority) {
      logMessage = `Changed priority from ${existingTask.priority} to ${updateData.priority}`;
    } else if (updateData.assigneeId !== undefined && updateData.assigneeId !== existingTask.assigneeId) {
      logMessage = updateData.assigneeId
        ? `Reassigned task to ${updatedTask.assignee?.name || "new member"}`
        : "Unassigned task";
    }

    if (logMessage) {
      await prisma.activityLog.create({
        data: {
          action: "UPDATED_TASK",
          details: logMessage,
          taskId: id,
          projectId: existingTask.projectId,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
