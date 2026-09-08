import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET_KEY = process.env.JWT_SECRET || "nova-super-secret-jwt-key-for-auth-production-grade-2026";
const encodedSecret = new TextEncoder().encode(SECRET_KEY);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("nova_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      title: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

export async function getAuthUserFromRequest(request: Request) {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  // Fallback to cookie
  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/nova_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;

  return await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      title: true,
      role: true,
    },
  });
}
