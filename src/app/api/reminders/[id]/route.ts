import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReminderDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";
import { ReminderCreateSchema } from "@/lib/validators";

// Update a reminder
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  
  // Partial update - allow any combination of fields
  const updateSchema = ReminderCreateSchema.partial();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  // Verify ownership
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.REMINDERS,
    [Query.equal("userId", userId), Query.limit(100)]
  );

  const reminder = result.documents.find((d) => d.$id === id);
  if (!reminder) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }

  // Build update payload with only provided fields
  const updateData: Record<string, unknown> = {};
  const data = parsed.data;
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.message !== undefined) updateData.message = data.message;
  if (data.scheduledAt !== undefined) {
    const scheduledDate = new Date(data.scheduledAt);
    if (scheduledDate <= new Date()) {
      return Response.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }
    updateData.scheduledAt = scheduledDate.toISOString();
  }
  if (data.source !== undefined) updateData.source = data.source;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = data.recurrenceEndDate;

  // Validate recurrence end date if both scheduledAt and recurrenceEndDate are being updated
  if (updateData.scheduledAt && updateData.recurrenceEndDate) {
    const startDate = new Date(updateData.scheduledAt as string);
    const endDate = new Date(updateData.recurrenceEndDate as string);
    if (endDate <= startDate) {
      return Response.json(
        { error: "Recurrence end date must be after the scheduled time" },
        { status: 400 }
      );
    }
  }

  const updated = await databases.updateDocument(
    DB_ID,
    COLLECTIONS.REMINDERS,
    id,
    updateData
  );

  return Response.json({
    reminder: updated as unknown as AppwriteDoc<ReminderDoc>,
  });
}

// Delete/cancel a reminder
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { databases } = createAdminClient();

  // Verify ownership
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.REMINDERS,
    [Query.equal("userId", userId), Query.limit(100)]
  );

  const reminder = result.documents.find((d) => d.$id === id);
  if (!reminder) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }

  // Update status to cancelled instead of deleting
  await databases.updateDocument(DB_ID, COLLECTIONS.REMINDERS, id, {
    status: "cancelled",
  });

  return Response.json({ success: true });
}
