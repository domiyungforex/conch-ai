import { auth } from "@clerk/nextjs/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import {
  DB_ID,
  COLLECTIONS,
  type UserDoc,
  type PaymentDoc,
  type WalletDoc,
  type AppwriteDoc,
} from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { PLANS, type PlanId } from "@/lib/plans";

// GET /api/billing/overview
// Admin-only: returns billing overview data including revenue, plan distribution,
// and payment history.

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  if (!isAdmin(userId)) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
    });
  }

  const { databases } = createAdminClient();

  // ── Fetch all users ────────────────────────────────────────────────────
  const usersResult = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.USERS,
    [Query.limit(1000)]
  );
  const users = usersResult.documents as unknown as AppwriteDoc<UserDoc>[];

  // ── Fetch all payments ─────────────────────────────────────────────────
  const paymentsResult = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PAYMENTS,
    [Query.orderDesc("$createdAt"), Query.limit(500)]
  );
  const payments = paymentsResult.documents as unknown as AppwriteDoc<PaymentDoc>[];

  // ── Fetch all wallets ──────────────────────────────────────────────────
  const walletsResult = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.WALLETS,
    [Query.limit(1000)]
  );
  const wallets = walletsResult.documents as unknown as AppwriteDoc<WalletDoc>[];

  // ── Calculate stats ────────────────────────────────────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Plan distribution
  const planDistribution: Record<string, number> = {};
  for (const user of users) {
    const plan = user.plan || "free";
    planDistribution[plan] = (planDistribution[plan] || 0) + 1;
  }

  // Revenue calculations
  const confirmedPayments = payments.filter(
    (p) => p.paymentState === "CONFIRMED"
  );

  const totalRevenue = confirmedPayments.reduce(
    (sum, p) => sum + (p.amountUsdcBaseUnits || 0),
    0
  );

  const monthlyRevenue = confirmedPayments
    .filter((p) => {
      const confirmed = new Date(p.confirmedAt || p.$createdAt);
      return confirmed >= firstOfMonth;
    })
    .reduce((sum, p) => sum + (p.amountUsdcBaseUnits || 0), 0);

  const recentPayments = confirmedPayments.filter((p) => {
    const confirmed = new Date(p.confirmedAt || p.$createdAt);
    return confirmed >= thirtyDaysAgo;
  });

  const recentRevenue = recentPayments.reduce(
    (sum, p) => sum + (p.amountUsdcBaseUnits || 0),
    0
  );

  // Active wallets (not disconnected)
  const activeWallets = wallets.filter((w) => !w.disconnectedAt);

  // Pending payments
  const pendingPayments = payments.filter(
    (p) =>
      p.paymentState === "PENDING" ||
      p.paymentState === "INITIATED" ||
      p.paymentState === "CONFIRMING"
  );

  // Failed payments
  const failedPayments = payments.filter(
    (p) =>
      p.paymentState === "FAILED" ||
      p.paymentState === "REJECTED" ||
      p.paymentState === "EXPIRED"
  );

  // MRR (Monthly Recurring Revenue) - sum of all active monthly plan values
  const activePaidUsers = users.filter(
    (u) =>
      u.plan !== "free" &&
      u.planExpiresAt &&
      new Date(u.planExpiresAt) > now
  );

  let mrr = 0;
  for (const user of activePaidUsers) {
    const plan = user.plan as PlanId;
    if (plan in PLANS) {
      mrr += PLANS[plan].priceMonthlyUsd;
    }
  }

  return Response.json({
    overview: {
      totalUsers: users.length,
      paidUsers: activePaidUsers.length,
      freeUsers: users.length - activePaidUsers.length,
      activeWallets: activeWallets.length,
      totalWallets: wallets.length,
    },
    revenue: {
      total: totalRevenue / 1e6, // Convert from base units
      thisMonth: monthlyRevenue / 1e6,
      last30Days: recentRevenue / 1e6,
      mrr,
      paymentCount: confirmedPayments.length,
    },
    planDistribution,
    recentPayments: payments.slice(0, 20).map((p) => ({
      id: p.$id,
      userId: p.userId,
      plan: p.plan,
      amount: (p.amountUsdcBaseUnits || 0) / 1e6,
      state: p.paymentState,
      txHash: p.txHash,
      confirmedAt: p.confirmedAt,
      createdAt: p.$createdAt,
    })),
    pendingPayments: pendingPayments.map((p) => ({
      id: p.$id,
      userId: p.userId,
      plan: p.plan,
      amount: (p.amountUsdcBaseUnits || 0) / 1e6,
      state: p.paymentState,
      txHash: p.txHash,
      createdAt: p.$createdAt,
    })),
    failedPayments: failedPayments.map((p) => ({
      id: p.$id,
      userId: p.userId,
      plan: p.plan,
      amount: (p.amountUsdcBaseUnits || 0) / 1e6,
      state: p.paymentState,
      failureReason: p.failureReason,
      txHash: p.txHash,
      createdAt: p.$createdAt,
    })),
    wallets: wallets.slice(0, 50).map((w) => ({
      id: w.$id,
      userId: w.userId,
      address: w.address,
      chainId: w.chainId,
      isPrimary: w.isPrimary,
      verifiedAt: w.verifiedAt,
      disconnectedAt: w.disconnectedAt,
      lastConnectedAt: w.lastConnectedAt,
    })),
  });
}
