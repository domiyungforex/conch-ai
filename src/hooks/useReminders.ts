"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppwriteDoc, ReminderDoc, ReminderRecurrence } from "@/lib/db";

export function useReminders() {
  const [reminders, setReminders] = useState<
    AppwriteDoc<ReminderDoc>[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data = await res.json();
      setReminders(data.reminders || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a reminder
  const createReminder = useCallback(
    async (
      title: string,
      message: string,
      scheduledAt: Date,
      recurrence: ReminderRecurrence = "none",
      recurrenceEndDate?: Date
    ) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          scheduledAt: scheduledAt.toISOString(),
          recurrence,
          recurrenceEndDate: recurrenceEndDate?.toISOString() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create reminder");
      }

      await fetchReminders();
      return true;
    },
    [fetchReminders]
  );

  // Cancel a reminder
  const cancelReminder = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to cancel reminder");

      await fetchReminders();
      return true;
    },
    [fetchReminders]
  );

  // Edit a reminder
  const editReminder = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        message?: string;
        scheduledAt?: Date;
        recurrence?: ReminderRecurrence;
        recurrenceEndDate?: Date | null;
      }
    ) => {
      const body: Record<string, unknown> = {};
      
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.message !== undefined) body.message = updates.message;
      if (updates.scheduledAt !== undefined) body.scheduledAt = updates.scheduledAt.toISOString();
      if (updates.recurrence !== undefined) body.recurrence = updates.recurrence;
      if (updates.recurrenceEndDate !== undefined) {
        body.recurrenceEndDate = updates.recurrenceEndDate?.toISOString() || null;
      }

      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit reminder");
      }

      await fetchReminders();
      return true;
    },
    [fetchReminders]
  );

  // Calculate next occurrence based on recurrence
  const getNextOccurrence = useCallback(
    (currentDate: Date, recurrence: ReminderRecurrence): Date | null => {
      const next = new Date(currentDate);

      switch (recurrence) {
        case "daily":
          next.setDate(next.getDate() + 1);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          break;
        default:
          return null;
      }

      return next;
    },
    []
  );

  // Send push notification to ALL devices via server
  const sendPushToAllDevices = useCallback(
    async (title: string, message: string, reminderId: string) => {
      try {
        await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body: message,
            tag: `reminder-${reminderId}`,
            url: "/",
          }),
        });
      } catch {
        // Non-critical - local notification still fires
      }
    },
    []
  );

  // Check for due reminders and trigger notifications
  useEffect(() => {
    const checkDueReminders = async () => {
      const now = new Date();
      const dueReminders = reminders.filter(
        (r) =>
          r.status === "pending" && new Date(r.scheduledAt) <= now
      );

      for (const reminder of dueReminders) {
        // Show local notification if permission is granted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(reminder.title, {
            body: reminder.message,
            icon: "/favicon.ico",
            tag: `reminder-${reminder.$id}`,
          });
        }

        // Send push notification to ALL devices via server
        sendPushToAllDevices(reminder.title, reminder.message, reminder.$id);

        // Handle recurring reminders - create next occurrence
        if (reminder.recurrence && reminder.recurrence !== "none") {
          const nextDate = getNextOccurrence(
            new Date(reminder.scheduledAt),
            reminder.recurrence
          );

          // Check if we've passed the recurrence end date
          const shouldContinue =
            nextDate &&
            (!reminder.recurrenceEndDate ||
              nextDate <= new Date(reminder.recurrenceEndDate));

          if (shouldContinue && nextDate) {
            // Create next occurrence
            try {
              await fetch("/api/reminders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: reminder.title,
                  message: reminder.message,
                  scheduledAt: nextDate.toISOString(),
                  recurrence: reminder.recurrence,
                  recurrenceEndDate: reminder.recurrenceEndDate,
                }),
              });
            } catch {
              // Silent fail
            }
          }
        }

        // Mark as sent on server
        try {
          await fetch(`/api/reminders/${reminder.$id}`, {
            method: "DELETE", // Uses status: "cancelled" which also marks as sent
          });
        } catch {
          // Silent fail - notification already shown
        }
      }

      // Refresh list after processing
      if (dueReminders.length > 0) {
        fetchReminders();
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(checkDueReminders, 30_000);
    // Also check immediately
    checkDueReminders();

    return () => clearInterval(interval);
  }, [reminders, fetchReminders, getNextOccurrence, sendPushToAllDevices]);

  // Initial fetch
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return {
    reminders,
    isLoading,
    error,
    createReminder,
    editReminder,
    cancelReminder,
    refetch: fetchReminders,
  };
}
