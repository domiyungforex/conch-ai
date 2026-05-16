import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const rawBody = await req.text();

  let event: WebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          name,
          avatarUrl: image_url ?? null,
          reputation: { create: {} },
        },
        update: {
          email,
          name,
          avatarUrl: image_url ?? null,
        },
      });
    } catch (err) {
      console.error("[webhook] user.created failed:", err);
      return new Response("Database error", { status: 500 });
    }
  }

  if (event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    try {
      await prisma.user.updateMany({
        where: { clerkId: id },
        data: { email, name, avatarUrl: image_url ?? null },
      });
    } catch (err) {
      console.error("[webhook] user.updated failed:", err);
      return new Response("Database error", { status: 500 });
    }
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      try {
        await prisma.user.deleteMany({ where: { clerkId: id } });
      } catch (err) {
        console.error("[webhook] user.deleted failed:", err);
        return new Response("Database error", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
