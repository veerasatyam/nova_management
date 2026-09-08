import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../src/lib/auth";

async function runTests() {
  console.log("🧪 Running Automated API & Business Logic Verification Tests...\n");

  // 1. Verify User database and auth
  console.log("1. Testing Auth & User Queries...");
  const adminUser = await prisma.user.findUnique({
    where: { email: "alex.rivera@nova.app" },
  });
  if (!adminUser) throw new Error("Admin user not found in database!");
  const validPassword = await bcrypt.compare("nova123456", adminUser.passwordHash);
  if (!validPassword) throw new Error("Password verification failed!");
  console.log("   ✅ Bcrypt password verification succeeded for", adminUser.email);

  const token = await signToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
  });
  if (!token) throw new Error("JWT token generation failed!");
  console.log("   ✅ Signed edge-compatible JWT token successfully");

  // 2. Verify Projects
  console.log("\n2. Testing Projects Retrieval & Relations...");
  const projects = await prisma.project.findMany({
    include: {
      owner: true,
      members: { include: { user: true } },
      tasks: true,
    },
  });
  if (projects.length === 0) throw new Error("No projects found!");
  console.log(`   ✅ Found ${projects.length} projects in database:`);
  projects.forEach((p) => {
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    console.log(`      - [${p.key}] ${p.name}: ${done}/${p.tasks.length} tasks completed (${p.members.length} members)`);
  });

  // 3. Verify Tasks, Subtasks & Comments
  console.log("\n3. Testing Tasks, Checklist Subtasks & Comments...");
  const testTask = await prisma.task.findFirst({
    where: { projectId: projects[0].id },
    include: {
      subtasks: true,
      comments: { include: { user: true } },
      assignee: true,
    },
  });
  if (!testTask) throw new Error("No tasks found in project!");
  console.log(`   ✅ Task: "${testTask.title}" (${testTask.status}, Priority: ${testTask.priority})`);
  console.log(`      Assignee: ${testTask.assignee?.name || "Unassigned"}`);
  console.log(`      Subtasks: ${testTask.subtasks.length} items`);
  console.log(`      Comments: ${testTask.comments.length} comments`);

  // 4. Test creating a new task
  console.log("\n4. Testing Task Creation & State Transition...");
  const newTask = await prisma.task.create({
    data: {
      title: "Verification Test Task - Automated Run",
      description: "Testing automated insertion and Kanban pipeline move",
      status: "TODO",
      priority: "HIGH",
      projectId: projects[0].id,
      creatorId: adminUser.id,
    },
  });
  console.log(`   ✅ Created Task ID: ${newTask.id} with status ${newTask.status}`);

  const movedTask = await prisma.task.update({
    where: { id: newTask.id },
    data: { status: "IN_PROGRESS" },
  });
  console.log(`   ✅ Successfully moved task to: ${movedTask.status}`);

  // 5. Test adding Subtask & Comment
  const subtask = await prisma.subtask.create({
    data: {
      title: "Check code quality",
      taskId: movedTask.id,
      completed: true,
    },
  });
  console.log(`   ✅ Added and completed subtask: "${subtask.title}"`);

  const comment = await prisma.comment.create({
    data: {
      content: "Automated verification test completed successfully.",
      taskId: movedTask.id,
      userId: adminUser.id,
    },
  });
  console.log(`   ✅ Posted discussion comment: "${comment.content}"`);

  // Clean up test task
  await prisma.comment.delete({ where: { id: comment.id } });
  await prisma.subtask.delete({ where: { id: subtask.id } });
  await prisma.task.delete({ where: { id: newTask.id } });
  console.log("   ✅ Cleaned up temporary test artifacts");

  console.log("\n🎉 ALL BACKEND & DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!\n");
}

runTests()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
