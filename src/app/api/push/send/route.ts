import { auth } from "@clerk/nextjs/server";
import { sendPushToAllDevices } from "@/lib/push";
import { z } from "zod";

const PushSendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  url: z.string().optional(),
});

// Send push notification to ALL of the user's registered devices
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = PushSendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await sendPushToAllDevices(userId, parsed.data);

  return Response.json({
    success: true,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors,
  });
}
