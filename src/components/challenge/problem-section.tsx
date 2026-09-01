"use client";

import { Brain, Cpu, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Persistent Memory",
    description:
      "Context that can remain available across interactions. Your preferences, projects, and knowledge persist.",
  },
  {
    icon: Cpu,
    title: "AI Agents",
    description:
      "Agents that can use context to perform tasks. They remember your work and build on previous results.",
  },
  {
    icon: Zap,
    title: "Continuous Intelligence",
    description:
      "Your AI experience can evolve instead of resetting every session. Each interaction deepens understanding.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Problem headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--conch-text)] mb-6 leading-tight">
            Every conversation shouldn&apos;t feel like
            <br className="hidden md:block" /> the first conversation.
          </h2>
          <p className="text-lg text-[var(--conch-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Traditional AI can be powerful but often lacks persistent personal context.
            Users repeatedly explain who they are, what they&apos;re working on, their
            preferences, goals, projects, previous decisions, knowledge, and workflows.
          </p>
        </div>

        {/* Solution headline */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold" style={{
            background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Conch remembers the context that matters.
          </h3>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="conch-glass rounded-2xl p-8 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.05))",
                  }}>
                  <Icon className="w-6 h-6 text-[var(--conch-purple-light)]" />
                </div>
                <h4 className="text-xl font-semibold text-[var(--conch-text)] mb-3">
                  {feature.title}
                </h4>
                <p className="text-[var(--conch-text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
