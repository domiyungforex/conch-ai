import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReminderDoc, type AppwriteDoc } from "@/lib/db";
import { ID } from "node-appwrite";

/**
 * Create a reminder for a user.
 * This can be called from the chat route when a user asks to set a reminder.
 */
export async function createReminder(
  userId: string,
  title: string,
  message: string,
  scheduledAt: Date,
  source?: string
): Promise<AppwriteDoc<ReminderDoc> | null> {
  // Validate scheduled time is in the future
  if (scheduledAt <= new Date()) {
    return null;
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
      scheduledAt: scheduledAt.toISOString(),
      status: "pending",
      source: source || "chat",
    }
  );

  return reminder as unknown as AppwriteDoc<ReminderDoc>;
}

/**
 * Parse a natural language time string into a Date object.
 * Supports formats like:
 * - "at 8:00 PM"
 * - "tomorrow at 10am"
 * - "in 2 hours"
 * - "on Friday at 3pm"
 */
export function parseReminderTime(timeStr: string): Date | null {
  const now = new Date();
  const lower = timeStr.toLowerCase().trim();

  // Handle "in X minutes/hours"
  const inMatch = lower.match(/in\s+(\d+)\s+(minute|minutes|hour|hours)/);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const result = new Date(now);
    if (unit.startsWith("minute")) {
      result.setMinutes(result.getMinutes() + amount);
    } else {
      result.setHours(result.getHours() + amount);
    }
    return result;
  }

  // Handle "at X:XX AM/PM"
  const atMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (atMatch) {
    let hours = parseInt(atMatch[1], 10);
    const minutes = parseInt(atMatch[2] || "0", 10);
    const ampm = atMatch[3];

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    if (!ampm && hours < 8) hours += 12; // Assume PM for small numbers without AM/PM

    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  // Handle "tomorrow at X"
  if (lower.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeOnly = lower.replace("tomorrow", "").replace("at", "").trim();
    const parsed = parseReminderTime(`at ${timeOnly}`);
    if (parsed) {
      parsed.setDate(tomorrow.getDate());
      parsed.setMonth(tomorrow.getMonth());
      parsed.setFullYear(tomorrow.getFullYear());
      return parsed;
    }
  }

  return null;
}

/**
 * Check if a user message looks like a reminder request.
 */
export function isReminderRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const reminderPatterns = [
    /remind\s+me/i,
    /set\s+(a\s+)?reminder/i,
    /create\s+(a\s+)?reminder/i,
    /don'?t\s+let\s+me\s+forget/i,
    /remember\s+to/i,
    /alert\s+me/i,
    /notify\s+me/i,
  ];
  return reminderPatterns.some((p) => p.test(lower));
}
