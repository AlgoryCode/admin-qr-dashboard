import { NextResponse } from "next/server";

/** Member (dashboard) app origin for admin "Üye olarak giriş" links. Set in Coolify at runtime. */
export function GET() {
  const url = (
    process.env.MEMBER_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEMBER_APP_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  return NextResponse.json({ url });
}
