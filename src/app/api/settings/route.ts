import { NextRequest } from "next/server";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import postgres from "postgres";

export async function GET(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { max: 5 });
    
    // Get user from session cookie
    const cookie = request.headers.get("cookie") || "";
    const sessionToken = cookie.match(/better-auth\.session_token=([^;]+)/)?.[1];
    
    if (!sessionToken) {
      await sql.end();
      return Response.json({ settings: null });
    }

    const sessions = await sql`SELECT user_id FROM sessions WHERE token = ${sessionToken} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      await sql.end();
      return Response.json({ settings: null });
    }

    const userId = sessions[0].user_id;
    const existing = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
    
    if (existing.length === 0) {
      // Create default settings
      const [settings] = await sql`INSERT INTO user_settings (user_id) VALUES (${userId}) RETURNING *`;
      await sql.end();
      return Response.json({ settings });
    }

    await sql.end();
    return Response.json({ settings: existing[0] });
  } catch (error) {
    console.error("Settings GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { max: 5 });
    const body = await request.json();
    
    const cookie = request.headers.get("cookie") || "";
    const sessionToken = cookie.match(/better-auth\.session_token=([^;]+)/)?.[1];
    
    if (!sessionToken) {
      await sql.end();
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessions = await sql`SELECT user_id FROM sessions WHERE token = ${sessionToken} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      await sql.end();
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = sessions[0].user_id;

    // Upsert settings
    const [settings] = await sql`
      INSERT INTO user_settings (user_id, preferred_translation, theme, font_size, memory_enabled, show_verse_numbers, daily_reminder, reminder_time, updated_at)
      VALUES (${userId}, ${body.preferredTranslation || "kjv"}, ${body.theme || "light"}, ${body.fontSize || "medium"}, 
              ${body.memoryEnabled || "true"}, ${body.showVerseNumbers || "true"}, ${body.dailyReminder || "false"}, 
              ${body.reminderTime || "08:00"}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        preferred_translation = ${body.preferredTranslation || "kjv"},
        theme = ${body.theme || "light"},
        font_size = ${body.fontSize || "medium"},
        memory_enabled = ${body.memoryEnabled || "true"},
        show_verse_numbers = ${body.showVerseNumbers || "true"},
        daily_reminder = ${body.dailyReminder || "false"},
        reminder_time = ${body.reminderTime || "08:00"},
        updated_at = NOW()
      RETURNING *
    `;

    await sql.end();
    return Response.json({ settings });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
