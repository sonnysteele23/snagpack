import { NextResponse } from "next/server";
import { AUTH_COOKIE, authToken, safeEqual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.APP_PASSWORD ?? "";

  if (!expected || typeof password !== "string" || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await authToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
