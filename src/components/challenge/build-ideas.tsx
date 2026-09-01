"use client";

import { User, Bot, Building2, Code2, Palette, Microscope } from "lucide-react";

const ideas = [
  {
    icon: User,
    title: "Personal AI",
    description: "An AI that understands your long-term goals and preferences.",
    color: "#7c3aed",
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "Agents that remember previous work and context.",
    color: "#8b5cf6",
  },
  {
    icon: Building2,
    title: "Business Memory",
    description: "A persistent knowledge layer for teams and businesses.",
    color: "#6d28d9",
  },
  {
    icon: Code2,
    title: "Developer Tools",
    description: "Build applications using Conch's memory and agent capabilities.",
    color: "#a78bfa",
  },
  {
    icon: Palette,
    title: "Creator AI",
    description:
      "An AI that remembers your brand, voice, content strategy and audience.",
    color: "#c084fc",
  },
  {
    icon: Microscope,
    title: "Research Agent",
    description:
      "A research assistant that can retain knowledge across projects.",
    color: "#7c3aed",
  },
];

export function BuildIdeas() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--conch-text)] mb-6">
            What Could You Build?
          </h2>
          <p className="text-lg text-[var(--conch-text-muted)] max-w-xl mx-auto">
            These are just examples. We want to see what YOU build.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.map((idea) => {
            const Icon = idea.icon;
            return (
              <div
                key={idea.title}
                className="conch-glass rounded-2xl p-6 transition-all duration-300 cursor-default group hover:scale-[1.02]"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:conch-glow-subtle"
                  style={{
                    background: `linear-gradient(135deg, ${idea.color}33, ${idea.color}11)`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: idea.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[var(--conch-text)] mb-2">
                  {idea.title}
                </h3>
                <p className="text-[var(--conch-text-muted)] text-sm leading-relaxed">
                  {idea.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
