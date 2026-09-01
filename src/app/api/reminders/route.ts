import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReminderDoc, type AppwriteDoc } from "@/lib/db";
import { Query, ID } from "node-appwrite";
import { ReminderCreateSchema } from "@/lib/validators";

// Create a reminder
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReminderCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, message, scheduledAt, source, recurrence, recurrenceEndDate } = parsed.data;

  // Validate scheduled time is in the future
  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    return Response.json(
      { error: "Scheduled time must be in the future" },
      { status: 400 }
    );
  }

  // Validate recurrence end date if provided
  if (recurrenceEndDate) {
    const endDate = new Date(recurrenceEndDate);
    if (endDate <= scheduledDate) {
      return Response.json(
        { error: "Recurrence end date must be after the scheduled time" },
        { status: 400 }
      );
    }
  }

  const { databases } = createAdminClient();

  const reminder = await databases.createDocument(
    DB_ID,
    COLLECTIONS.REMINDERS,
    ID.unique(),
    {
      userId,
      title,
      message,
      scheduledAt: scheduledDate.toISOString(),
      status: "pending",
      source: source || null,
      recurrence: recurrence || "none",
      recurrenceEndDate: recurrenceEndDate || null,
    }
  );

  return Response.json(
    { reminder: reminder as unknown as AppwriteDoc<ReminderDoc> },
    { status: 201 }
  );
}

// List user's reminders
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { databases } = createAdminClient();

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.REMINDERS,
    [
      Query.equal("userId", userId),
      Query.equal("status", "pending"),
      Query.orderAsc("scheduledAt"),
      Query.limit(50),
    ]
  );

  return Response.json({
    reminders: result.documents as unknown as AppwriteDoc<ReminderDoc>[],
  });
}
