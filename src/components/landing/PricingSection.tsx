"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "Perfect for getting started",
    features: [
      "100 memories",
      "1 AI agent",
      "50 conversations/month",
      "Semantic search",
      "Basic memory categories",
      "Community support",
    ],
    cta: "Start Free",
    href: "/dashboard",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 19,
    yearly: 15,
    description: "For serious AI power users",
    features: [
      "Unlimited memories",
      "10 AI agents",
      "Unlimited conversations",
      "Advanced semantic search",
      "Wallet identity proof",
      "Memory export & import",
      "API access",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/dashboard",
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Unlimited agents & teams",
      "Custom memory architecture",
      "SSO & advanced auth",
      "On-chain reputation system",
      "Dedicated infrastructure",
      "SLA guarantee",
      "White-glove onboarding",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@conch.ai",
    highlight: false,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-white/10 text-xs text-slate-400 mb-4">
          Pricing
        </span>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Simple,{" "}
          <span className="gradient-text">transparent</span>
          {" "}pricing
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Start free. Scale as you grow. No surprise fees.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 glass border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!yearly ? "bg-coral-600/30 text-coral-300" : "text-slate-400 hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${yearly ? "bg-coral-600/30 text-coral-300" : "text-slate-400 hover:text-white"}`}
          >
            Yearly
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">-20%</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="h-full"
          >
            <GlassCard
              className={`p-7 h-full flex flex-col relative ${plan.highlight ? "border-coral-500/40 glow-primary" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-coral-600 to-gold-600 text-white text-xs font-semibold shadow-lg shadow-coral-500/30">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${yearly ? plan.yearly : plan.monthly}</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">Custom</div>
                )}
                {yearly && plan.monthly !== null && plan.monthly > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">Billed annually — save ${(plan.monthly - plan.yearly!) * 12}/year</p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-coral-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "default" : "secondary"}
                size="lg"
                className="w-full"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
