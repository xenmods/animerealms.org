import { NextRequest, NextResponse } from "next/server";

let latestSessionData: {
  token?: string;
  cookies?: Array<{ name: string; value: string }>;
  user?: any;
  timestamp: number;
} | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token =
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value ||
      body.token;

    const cookies = req.cookies.getAll();

    latestSessionData = {
      token: token,
      cookies: cookies.map((c) => ({ name: c.name, value: c.value })),
      user: body.user,
      timestamp: Date.now(),
    };

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (latestSessionData && Date.now() - latestSessionData.timestamp > 300000) {
    latestSessionData = null;
  }

  if (latestSessionData && (latestSessionData.token || latestSessionData.user)) {
    return NextResponse.json({
      authenticated: true,
      user: latestSessionData.user,
      token: latestSessionData.token,
      hasToken: Boolean(latestSessionData.token),
    });
  }

  return NextResponse.json({
    authenticated: false,
  });
}