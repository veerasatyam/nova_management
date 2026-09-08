import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

const DEMO_ACCOUNTS = {
  admin: {
    email: "alex.rivera@nova.app",
    name: "Alex Rivera",
    title: "Engineering Lead",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  manager: {
    email: "sarah.chen@nova.app",
    name: "Sarah Chen",
    title: "Senior Product Manager",
    role: "MANAGER",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  developer: {
    email: "david.kim@nova.app",
    name: "David Kim",
    title: "Full Stack Engineer",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
};

export async function POST(request: Request) {
  try {
    const { role = "manager" } = await request.json();
    const demoInfo = DEMO_ACCOUNTS[role as keyof typeof DEMO_ACCOUNTS] || DEMO_ACCOUNTS.manager;

    let user = await prisma.user.findUnique({
      where: { email: demoInfo.email },
    });

    if (!user) {
      const defaultPasswordHash = await hashPassword("nova123456");
      user = await prisma.user.create({
        data: {
          name: demoInfo.name,
          email: demoInfo.email,
          passwordHash: defaultPasswordHash,
          title: demoInfo.title,
          role: demoInfo.role,
          avatar: demoInfo.avatar,
        },
      });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      title: user.title,
      role: user.role,
    };

    const response = NextResponse.json({
      user: userProfile,
      token,
      message: `Logged in as ${demoInfo.name} (${demoInfo.title})`,
    });

    response.cookies.set({
      name: "nova_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: "Internal server error during demo login" },
      { status: 500 }
    );
  }
}
