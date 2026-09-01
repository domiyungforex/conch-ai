"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  Wallet,
  TrendingUp,
  ExternalLink,
  Clock,
  XCircle,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlockExplorerTxUrl } from "@/lib/chainConfig";

interface BillingOverview {
  overview: {
    totalUsers: number;
    paidUsers: number;
    freeUsers: number;
    activeWallets: number;
    totalWallets: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    last30Days: number;
    mrr: number;
    paymentCount: number;
  };
  planDistribution: Record<string, number>;
  recentPayments: Array<{
    id: string;
    userId: string;
    plan: string;
    amount: number;
    state: string;
    txHash: string;
    confirmedAt: string;
    createdAt: string;
  }>;
  pendingPayments: Array<{
    id: string;
    userId: string;
    plan: string;
    amount: number;
    state: string;
    txHash: string;
    createdAt: string;
  }>;
  failedPayments: Array<{
    id: string;
    userId: string;
    plan: string;
    amount: number;
    state: string;
    failureReason: string | null;
    txHash: string;
    createdAt: string;
  }>;
  wallets: Array<{
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isPrimary: boolean;
    verifiedAt: string | null;
    disconnectedAt: string | null;
    lastConnectedAt: string | null;
  }>;
}

async function fetchBillingOverview(): Promise<BillingOverview> {
  const res = await fetch("/api/billing/overview");
  if (!res.ok) throw new Error("Failed to load billing overview");
  return res.json();
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "coral",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-${color}-500/15 flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
          {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </GlassCard>
  );
}

export default function AdminBillingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-billing"],
    queryFn: fetchBillingOverview,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400">
        Failed to load billing data. You may not have admin access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Billing Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Revenue, subscriptions, and payment analytics
        </p>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Monthly Recurring Revenue"
          value={`$${data.revenue.mrr.toLocaleString()}`}
          sub="From active subscriptions"
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue (30 days)"
          value={`$${data.revenue.last30Days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${data.revenue.paymentCount} total payments`}
          color="coral"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={data.overview.totalUsers}
          sub={`${data.overview.paidUsers} paid · ${data.overview.freeUsers} free`}
          color="blue"
        />
        <StatCard
          icon={Wallet}
          label="Wallets"
          value={data.overview.activeWallets}
          sub={`${data.overview.totalWallets} total linked`}
          color="gold"
        />
      </div>

      {/* ── Plan Distribution ────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Plan Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(data.planDistribution)
            .sort(([, a], [, b]) => b - a)
            .map(([plan, count]) => (
              <div key={plan} className="bg-white/5 rounded-xl p-3 border border-white/8 text-center">
                <p className="text-lg font-bold text-white capitalize">{plan}</p>
                <p className="text-sm text-slate-400">{count} users</p>
              </div>
            ))}
        </div>
      </GlassCard>

      {/* ── Pending Payments ─────────────────────────────────────────── */}
      {data.pendingPayments.length > 0 && (
        <GlassCard className="p-6 border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Pending Payments</h2>
            <Badge className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30">
              {data.pendingPayments.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {data.pendingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-sm">
                <div className="min-w-0">
                  <p className="text-white text-xs">{truncateAddress(p.userId)}</p>
                  <p className="text-xs text-slate-500">{p.plan} · ${p.amount.toFixed(2)}</p>
                </div>
                <a
                  href={getBlockExplorerTxUrl(p.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white shrink-0"
                >
                  {truncateHash(p.txHash)} <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Failed Payments ──────────────────────────────────────────── */}
      {data.failedPayments.length > 0 && (
        <GlassCard className="p-6 border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-red-400" />
            <h2 className="text-base font-semibold text-white">Failed Payments</h2>
            <Badge className="text-xs bg-red-500/15 text-red-300 border-red-500/30">
              {data.failedPayments.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {data.failedPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-sm">
                <div className="min-w-0">
                  <p className="text-white text-xs">{truncateAddress(p.userId)}</p>
                  <p className="text-xs text-slate-500">{p.plan} · ${p.amount.toFixed(2)}</p>
                  {p.failureReason && (
                    <p className="text-[11px] text-red-400/80 mt-0.5">{p.failureReason}</p>
                  )}
                </div>
                <a
                  href={getBlockExplorerTxUrl(p.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white shrink-0"
                >
                  {truncateHash(p.txHash)} <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Recent Payments ──────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/8">
                <th className="text-left py-2 pr-4 font-medium">User</th>
                <th className="text-left py-2 pr-4 font-medium">Plan</th>
                <th className="text-right py-2 pr-4 font-medium">Amount</th>
                <th className="text-left py-2 pr-4 font-medium">State</th>
                <th className="text-left py-2 pr-4 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">
                    {truncateAddress(p.userId)}
                  </td>
                  <td className="py-2.5 pr-4 capitalize">{p.plan}</td>
                  <td className="py-2.5 pr-4 text-right">${p.amount.toFixed(2)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge
                      className={
                        p.state === "CONFIRMED"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : p.state === "REJECTED" || p.state === "FAILED"
                          ? "bg-red-500/15 text-red-300 border-red-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }
                    >
                      {p.state}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-slate-400">
                    {formatDate(p.confirmedAt || p.createdAt)}
                  </td>
                  <td className="py-2.5">
                    <a
                      href={getBlockExplorerTxUrl(p.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {truncateHash(p.txHash)} <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ── Wallets ──────────────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Linked Wallets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/8">
                <th className="text-left py-2 pr-4 font-medium">User</th>
                <th className="text-left py-2 pr-4 font-medium">Address</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 pr-4 font-medium">Linked</th>
                <th className="text-left py-2 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.wallets.map((w) => (
                <tr key={w.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">
                    {truncateAddress(w.userId)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <a
                      href={getBlockExplorerTxUrl(w.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-slate-400 hover:text-white"
                    >
                      {truncateAddress(w.address)} <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </td>
                  <td className="py-2.5 pr-4">
                    {w.disconnectedAt ? (
                      <Badge className="text-xs bg-slate-500/15 text-slate-300 border-slate-500/30">
                        Disconnected
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-slate-400">
                    {formatDate(w.verifiedAt)}
                  </td>
                  <td className="py-2.5 text-xs text-slate-400">
                    {formatDate(w.lastConnectedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
