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
    await prisma.subtask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Subtask deleted" });
  } catch (error: any) {
    console.error("DELETE subtask error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
