export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Refresh user details from DB to keep preferences accurate
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        preferredBankId: true,
        preferredBranchId: true,
        kycSelfReported: true,
        panSelfReported: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ user: user || session });
  } catch {
    return NextResponse.json({ user: session });
  }
}
