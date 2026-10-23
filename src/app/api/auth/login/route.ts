export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || typeof email !== "string" || !email.trim() || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "No account found with this email. Please create an account first.",
          notRegistered: true 
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { 
          error: "Incorrect password. Please check your password and try again.",
          wrongPassword: true 
        },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone,
      preferredBankId: user.preferredBankId,
      preferredBranchId: user.preferredBranchId,
      kycSelfReported: user.kycSelfReported,
      panSelfReported: user.panSelfReported,
    };

    await setSessionCookie(sessionPayload);

    // Record audit log safely (non-fatal)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          resourceType: "AUTH",
          details: `Successful login for ${user.email} (${user.role})`,
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
    console.error("Login error:", err);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred during login.",
        details: err?.message || String(err)
      },
      { status: 500 }
    );
  }
}
