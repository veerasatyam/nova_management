import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (assigneeId && assigneeId !== "ALL") {
      where.assigneeId = assigneeId === "UNASSIGNED" ? null : assigneeId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, key: true, color: true },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Determine the next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: data.projectId },
      orderBy: { taskNumber: "desc" },
    });
    const taskNumber = (lastTask?.taskNumber || 0) + 1;

    // Determine the order (put at the bottom of the column)
    const columnCount = await prisma.task.count({
      where: { projectId: data.projectId, status: data.status },
    });

    const task = await prisma.task.create({
      data: {
        taskNumber,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        order: columnCount,
        tags: data.tags,
        estimatedHours: data.estimatedHours,
        projectId: data.projectId,
        creatorId: user.id,
        assigneeId: data.assigneeId || null,
        activityLogs: {
          create: {
            action: "CREATED_TASK",
            details: `Created task "${data.title}" in ${data.status}`,
            projectId: data.projectId,
            userId: user.id,
          },
        },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
        subtasks: true,
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
