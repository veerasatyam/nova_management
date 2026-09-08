import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const projectCreateSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).default("ACTIVE"),
  color: z.string().default("#0d9488"),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { key: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      const inProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const todo = p.tasks.filter((t) => t.status === "TODO").length;
      const inReview = p.tasks.filter((t) => t.status === "IN_REVIEW").length;
      const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        ...p,
        taskStats: {
          total,
          done,
          inProgress,
          todo,
          inReview,
          progressPercentage,
        },
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
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
    const validated = projectCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check if key already exists
    const existing = await prisma.project.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Project key "${data.key}" is already taken` },
        { status: 409 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description,
        status: data.status,
        priority: data.priority,
        color: data.color,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
        activityLogs: {
          create: {
            action: "CREATED_PROJECT",
            details: `Created project ${data.name} (${data.key})`,
            userId: user.id,
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
