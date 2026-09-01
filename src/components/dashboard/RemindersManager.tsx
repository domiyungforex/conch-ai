"use client";

import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useReminders } from "@/hooks/useReminders";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock, Repeat, Pencil } from "lucide-react";
import type { ReminderRecurrence, AppwriteDoc, ReminderDoc } from "@/lib/db";

const RECURRENCE_OPTIONS: { value: ReminderRecurrence; label: string }[] = [
  { value: "none", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function RemindersManager() {
  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const { reminders, isLoading: remindersLoading, createReminder, editReminder, cancelReminder } =
    useReminders();

  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<AppwriteDoc<ReminderDoc> | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setDate("");
    setTime("");
    setRecurrence("none");
    setRecurrenceEndDate("");
    setEditingReminder(null);
  };

  const handleCreateReminder = async () => {
    if (!title || !date || !time) return;

    setIsCreating(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : undefined;
      await createReminder(title, message || title, scheduledAt, recurrence, endDate);
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create reminder:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditReminder = async () => {
    if (!editingReminder || !title || !date || !time) return;

    setIsCreating(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
      await editReminder(editingReminder.$id, {
        title,
        message: message || title,
        scheduledAt,
        recurrence,
        recurrenceEndDate: endDate,
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to edit reminder:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (reminder: AppwriteDoc<ReminderDoc>) => {
    setEditingReminder(reminder);
    setTitle(reminder.title);
    setMessage(reminder.message);
    
    // Parse the scheduledAt date
    const scheduledDate = new Date(reminder.scheduledAt);
    const dateStr = scheduledDate.toISOString().split("T")[0];
    const timeStr = scheduledDate.toTimeString().slice(0, 5);
    setDate(dateStr);
    setTime(timeStr);
    
    setRecurrence(reminder.recurrence || "none");
    setRecurrenceEndDate(reminder.recurrenceEndDate ? reminder.recurrenceEndDate.split("T")[0] : "");
    setShowForm(true);
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
      // Also request browser notification permission
      await requestNotificationPermission();
    }
  };

  const formatScheduledAt = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRecurrenceLabel = (recurrence: ReminderRecurrence) => {
    const option = RECURRENCE_OPTIONS.find((opt) => opt.value === recurrence);
    return option?.label || "One-time";
  };

  return (
    <div className="space-y-4">
      {/* Push Notification Toggle */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Push Notifications
        </h2>

        {!isSupported ? (
          <p className="text-sm text-slate-400">
            Push notifications are not supported in this browser. Try Safari on
            iOS 16.4+ or Chrome on desktop.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-white">
                  Enable Push Notifications
                </Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Get notified on your device when reminders are due
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={handleTogglePush}
                disabled={pushLoading}
              />
            </div>

            {notificationPermission === "denied" && (
              <p className="text-xs text-amber-400">
                Notifications are blocked. Please enable them in your browser
                settings.
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Reminders List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Upcoming Reminders
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Reminder
          </Button>
        </div>

        {/* Create/Edit Reminder Form */}
        {showForm && (
          <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <h3 className="text-sm font-medium text-white">
              {editingReminder ? "Edit Reminder" : "New Reminder"}
            </h3>
            <Input
              placeholder="Reminder title (e.g., Meeting with Trevin)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Details (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white flex-1"
              />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white flex-1"
              />
            </div>

            {/* Recurrence Selector */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Repeat</Label>
              <div className="flex gap-2">
                {RECURRENCE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={recurrence === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecurrence(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recurrence End Date (shown when recurrence is not none) */}
            {recurrence !== "none" && (
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Stop repeating after (optional)</Label>
                <Input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min={date}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={editingReminder ? handleEditReminder : handleCreateReminder}
                disabled={!title || !date || !time || isCreating}
                className="flex-1"
              >
                {isCreating
                  ? editingReminder
                    ? "Saving..."
                    : "Creating..."
                  : editingReminder
                  ? "Save Changes"
                  : "Create Reminder"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reminders List */}
        {remindersLoading ? (
          <p className="text-sm text-slate-400">Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming reminders.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.$id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-coral-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {reminder.title}
                      </p>
                      {reminder.recurrence && reminder.recurrence !== "none" && (
                        <span className="inline-flex items-center gap-1 text-xs text-coral-300 bg-coral-500/10 px-1.5 py-0.5 rounded">
                          <Repeat className="w-3 h-3" />
                          {getRecurrenceLabel(reminder.recurrence)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatScheduledAt(reminder.scheduledAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(reminder)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelReminder(reminder.$id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
