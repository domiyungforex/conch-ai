import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATTERNS = [
  /^\/dashboard/,
  /^\/chat/,
  /^\/memory/,
  /^\/agents/,
  /^\/wallet/,
  /^\/settings/,
  /^\/reputation/,
  /^\/shared/,
  /^\/api\/chat/,
  /^\/api\/conversations/,
  /^\/api\/memory/,
  /^\/api\/agents/,
  /^\/api\/embeddings/,
  /^\/api\/search/,
  /^\/api\/wallet/,
  /^\/api\/api-keys/,
  /^\/api\/shared-contexts/,
  /^\/api\/user/,
];

const COOKIE = process.env.APPWRITE_SESSION_COOKIE ?? "appwrite-session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATTERNS.some((p) => p.test(pathname));

  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get(COOKIE);

  if (!session?.value) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
