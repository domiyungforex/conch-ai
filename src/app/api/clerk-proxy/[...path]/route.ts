import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.services";
const CLERK_HOST = "clerk.conchportal.com";

async function proxy(req: NextRequest, path: string[]) {
  const url = `${CLERK_API}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set("host", CLERK_HOST);
  headers.delete("content-length");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const resp = await fetch(url, { method: req.method, headers, body });

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: resp.headers,
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
