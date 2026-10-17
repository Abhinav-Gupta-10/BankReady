export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const seedScript = path.join(process.cwd(), "scripts", "seed.js");
    exec(`node "${seedScript}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("Seed execution error:", err, stderr);
        resolve(NextResponse.json({ error: "Failed to reset demo data.", details: stderr }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ success: true, message: "Database re-seeded successfully!", output: stdout }));
      }
    });
  });
}
