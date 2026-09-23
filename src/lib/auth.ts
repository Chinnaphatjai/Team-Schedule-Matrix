import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import { SessionUser } from "./types";

const COOKIE_NAME = "teamschedule_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "teamschedule-ultra-secure-jwt-secret-key-32bytes-min-2026"
);

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    tokenVersion: user.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || typeof payload.tokenVersion !== "number") return null;

    return {
      id: payload.sub,
      name: (payload.name as string) || "",
      email: (payload.email as string) || "",
      role: (payload.role as any) || "MEMBER",
      status: (payload.status as string) || "ACTIVE",
      tokenVersion: payload.tokenVersion,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    // Verify token version in database to ensure session hasn't been revoked
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        tokenVersion: true,
      },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion || user.status !== "ACTIVE") {
      await clearSessionCookie();
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      status: user.status,
      tokenVersion: user.tokenVersion,
    };
  } catch {
    return null;
  }
}
