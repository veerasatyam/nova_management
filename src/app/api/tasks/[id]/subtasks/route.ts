import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

const createSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = params;
    const body = await request.json();
    const validated = createSubtaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const count = await prisma.subtask.count({ where: { taskId } });

    const subtask = await prisma.subtask.create({
      data: {
        title: validated.data.title,
        taskId,
        order: count,
        completed: false,
      },
    });

    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error: any) {
    console.error("POST subtasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
