import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const response = NextResponse.redirect(new URL("/en", "http://localhost:3000"));

  if (token) {
    response.cookies.set("authjs.session-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.set("next-auth.session-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.set("__Secure-authjs.session-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return response;
}