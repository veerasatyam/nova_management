import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const projectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  color: z.string().optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
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

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { key: id.toUpperCase() }],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true, title: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, title: true, role: true },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
            subtasks: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: { comments: true, subtasks: true },
            },
          },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
        activityLogs: {
          take: 15,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = project.tasks.filter((t) => t.status === "TODO").length;
    const inReview = project.tasks.filter((t) => t.status === "IN_REVIEW").length;
    const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return NextResponse.json({
      project: {
        ...project,
        taskStats: {
          total,
          done,
          inProgress,
          todo,
          inReview,
          progressPercentage,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
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
    const validated = projectUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data: any = { ...validated.data };
    if (data.startDate !== undefined) {
      data.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        action: "UPDATED_PROJECT",
        details: `Updated project settings`,
        projectId: id,
        userId: user.id,
      },
    });

    return NextResponse.json({ project: updated });
  } catch (error: any) {
    console.error("PATCH /api/projects/[id] error:", error);
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
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
