import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY =
  process.env.JWT_SECRET || "nova-super-secret-jwt-key-for-auth-production-grade-2026";
const encodedSecret = new TextEncoder().encode(SECRET_KEY);

const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/analytics", "/team"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  const token = request.cookies.get("nova_token")?.value;

  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, encodedSecret);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // If visiting a protected route while unauthenticated, redirect to login
  if (isProtected && !isValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If visiting login/register while already authenticated, redirect to dashboard
  if (isAuthRoute && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/analytics/:path*",
    "/team/:path*",
    "/login",
    "/register",
  ],
};
