import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { UserSession, UserRole } from "./types";

const SESSION_COOKIE_NAME = "bankready_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "bankready_super_secure_session_secret_2026_xyz!";

// Simple robust HMAC-signed session token
export function createSessionToken(payload: UserSession): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encodedData = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedData)
    .digest("base64url");
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    const [encodedData, signature] = token.split(".");
    if (!encodedData || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedData)
      .digest("base64url");

    if (expectedSig !== signature) return null;

    const data = JSON.parse(Buffer.from(encodedData, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      phone: data.phone,
      preferredBankId: data.preferredBankId,
      preferredBranchId: data.preferredBranchId,
      kycSelfReported: data.kycSelfReported,
      panSelfReported: data.panSelfReported,
    };
  } catch {
    return null;
  }
}

// Password hashing using PBKDF2 with salt (built-in crypto, 100% reliable)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) resolve(false);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(session: UserSession): Promise<void> {
  const token = createSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
