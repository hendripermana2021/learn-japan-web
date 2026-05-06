import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "learn-japan-web",
    timestamp: new Date().toISOString(),
  });
}
