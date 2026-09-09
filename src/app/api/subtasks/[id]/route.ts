import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const updateSubtaskSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
});

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
    const validated = updateSubtaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const existingSubtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: {
              include: {
                members: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const isSystemAdmin = user.role === "ADMIN";
    const isOwner = existingSubtask.task.project.ownerId === user.id;
    const isMember = existingSubtask.task.project.members.some(
      (m) => m.userId === user.id
    );

    if (!isSystemAdmin && !isOwner && !isMember) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this subtask" },
        { status: 403 }
      );
    }

    const subtask = await prisma.subtask.update({
      where: { id },
      data: validated.data,
    });

    return NextResponse.json({ subtask });
  } catch (error: any) {
    console.error("PATCH subtask error:", error);
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
    const existingSubtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: {
              include: {
                members: { select: { userId: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const isSystemAdmin = user.role === "ADMIN";
    const isOwner = existingSubtask.task.project.ownerId === user.id;
    const isCreator = existingSubtask.task.creatorId === user.id;
    const isProjectAdmin = existingSubtask.task.project.members.some(
      (m) => m.userId === user.id && (m.role === "ADMIN" || m.role === "MANAGER")
    );

    if (!isSystemAdmin && !isOwner && !isCreator && !isProjectAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this subtask" },
        { status: 403 }
      );
    }

    await prisma.subtask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Subtask deleted" });
  } catch (error: any) {
    console.error("DELETE subtask error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
