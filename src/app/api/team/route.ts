import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest, hashPassword } from "@/lib/auth";

const addMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]).default("MEMBER"),
  projectId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              title: true,
              role: true,
            },
          },
        },
      });
      return NextResponse.json({ members: projectMembers });
    }

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            projects: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error("GET /api/team error:", error);
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
    const validated = addMemberSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, title, role, projectId } = validated.data;

    // Privilege Escalation Prevention:
    // Only System Admins or Project Owners/Admins can grant ADMIN or MANAGER roles.
    const isSystemAdmin = user.role === "ADMIN";
    if ((role === "ADMIN" || role === "MANAGER") && !isSystemAdmin) {
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { members: true },
        });
        const isProjectAdmin =
          project?.ownerId === user.id ||
          project?.members.some((m) => m.userId === user.id && m.role === "ADMIN");

        if (!isProjectAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only administrators can assign Admin or Manager roles" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can assign Admin or Manager roles" },
          { status: 403 }
        );
      }
    }

    let targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      const passwordHash = await hashPassword("nova123456");
      targetUser = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          title: title || "Collaborator",
          role,
        },
      });
    }

    if (projectId) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUser.id,
          },
        },
      });

      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId,
            userId: targetUser.id,
            role,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "ADDED_MEMBER",
            details: `Added ${targetUser.name} to the project as ${role}`,
            projectId,
            userId: user.id,
          },
        });
      }
    }

    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        title: targetUser.title,
        role: targetUser.role,
      },
      message: "Member added successfully",
    });
  } catch (error: any) {
    console.error("POST /api/team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
