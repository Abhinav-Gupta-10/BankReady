export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Full legal name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required (e.g. name@example.com)." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check application-level uniqueness first
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "An account with this email address already exists. Please sign in instead.",
          alreadyRegistered: true 
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // CRITICAL SECURITY RULE: Public registration strictly creates CUSTOMER accounts.
    const userRole = "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        role: userRole,
        isVerified: true,
      },
    });

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone,
    };

    await setSessionCookie(sessionPayload);

    // Record audit log safely (non-fatal)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTER",
          resourceType: "AUTH",
          details: `Registered new CUSTOMER account for ${normalizedEmail}`,
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal audit log warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { 
          error: "An account with this email address already exists. Please sign in instead.",
          alreadyRegistered: true 
        },
        { status: 409 }
      );
    }
    console.error("Registration error:", err);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred during registration.",
        details: err?.message || String(err)
      },
      { status: 500 }
    );
  }
}
