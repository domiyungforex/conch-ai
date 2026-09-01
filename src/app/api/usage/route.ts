import { auth } from "@clerk/nextjs/server";
import { getUserUsageStats } from "@/lib/apiUsage";

// GET /api/usage — Returns API usage statistics for the authenticated user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const stats = await getUserUsageStats(userId, 30);

  return Response.json({
    period: "30 days",
    totalRequests: stats.totalRequests,
    byMethod: stats.byMethod,
    byPath: stats.byPath,
    byStatus: stats.byStatus,
    recentActivity: stats.recentActivity,
  });
}
