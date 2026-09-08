import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const taskWhere: any = {};
    if (projectId) taskWhere.projectId = projectId;

    // Fetch projects
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({ where: { status: "ACTIVE" } });
    const completedProjects = await prisma.project.count({ where: { status: "COMPLETED" } });

    // Fetch tasks
    const allTasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        createdAt: true,
      },
    });

    const now = new Date();
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const inReviewTasks = allTasks.filter((t) => t.status === "IN_REVIEW").length;
    const todoTasks = allTasks.filter((t) => t.status === "TODO").length;
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Priority breakdown
    const priorityBreakdown = [
      { name: "Urgent", count: allTasks.filter((t) => t.priority === "URGENT").length, color: "#f43f5e" },
      { name: "High", count: allTasks.filter((t) => t.priority === "HIGH").length, color: "#f97316" },
      { name: "Medium", count: allTasks.filter((t) => t.priority === "MEDIUM").length, color: "#0ea5e9" },
      { name: "Low", count: allTasks.filter((t) => t.priority === "LOW").length, color: "#94a3b8" },
    ];

    // Status breakdown for charts
    const statusBreakdown = [
      { name: "To Do", count: todoTasks, color: "#94a3b8" },
      { name: "In Progress", count: inProgressTasks, color: "#3b82f6" },
      { name: "In Review", count: inReviewTasks, color: "#f59e0b" },
      { name: "Done", count: doneTasks, color: "#10b981" },
    ];

    // Team workload distribution
    const users = await prisma.user.findMany({
      select: { id: true, name: true, avatar: true, title: true },
    });

    const memberWorkload = users.map((u) => {
      const userTasks = allTasks.filter((t) => t.assigneeId === u.id);
      const done = userTasks.filter((t) => t.status === "DONE").length;
      const pending = userTasks.filter((t) => t.status !== "DONE").length;
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        title: u.title,
        total: userTasks.length,
        done,
        pending,
      };
    }).filter((u) => u.total > 0 || !projectId);

    // Recent activity
    const activityLogs = await prisma.activityLog.findMany({
      where: projectId ? { projectId } : {},
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        task: {
          select: { id: true, title: true },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    });

    return NextResponse.json({
      metrics: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        doneTasks,
        inProgressTasks,
        inReviewTasks,
        todoTasks,
        overdueTasks,
        completionRate,
      },
      priorityBreakdown,
      statusBreakdown,
      memberWorkload,
      recentActivity: activityLogs,
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
