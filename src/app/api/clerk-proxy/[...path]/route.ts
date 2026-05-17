import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.services";
const CLERK_HOST = "clerk.conchportal.com";

// Headers that must be stripped from the proxied response.
// Node's fetch() auto-decompresses the body, so forwarding these would
// cause the client to attempt a second decompression pass on raw text.
const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "content-length",
  "connection",
  "keep-alive",
]);

async function proxy(req: NextRequest, path: string[]) {
  const url = `${CLERK_API}/${path.join("/")}${req.nextUrl.search}`;

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("host", CLERK_HOST);
  reqHeaders.delete("content-length");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  let resp: Response;
  try {
    resp = await fetch(url, { method: req.method, headers: reqHeaders, body });
  } catch (err) {
    console.error("[clerk-proxy] upstream fetch failed:", err);
    return new NextResponse(JSON.stringify({ error: "Proxy upstream error" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const responseHeaders = new Headers();
  resp.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
