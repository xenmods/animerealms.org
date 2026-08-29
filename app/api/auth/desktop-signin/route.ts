import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.ANILIST_ID || "21642";
  const redirectUri = "http://localhost:3000/api/auth/callback/anilist";
  const anilistAuthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  return NextResponse.redirect(anilistAuthUrl);
}
