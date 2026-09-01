"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Memory", href: "https://conch.ai" },
    { label: "Agents", href: "https://conch.ai" },
    { label: "SDK/API", href: "https://conch.ai" },
  ],
  Challenge: [
    { label: "Documentation", href: "/challenge" },
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" },
  ],
  Connect: [
    { label: "X / Twitter", href: "https://x.com/conch_ai" },
    { label: "Discord", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function ChallengeFooter() {
  return (
    <footer className="border-t border-[var(--conch-border)]" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* CTA tagline */}
        <div className="text-center mb-12">
          <p className="text-xl md:text-2xl font-bold text-[var(--conch-text)] mb-1">
            Build something worth remembering.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo column */}
          <div>
            <Link href="/challenge" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                }}
              >
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="text-[var(--conch-text)] font-semibold text-lg">
                Conch
              </span>
            </Link>
            <p className="text-sm text-[var(--conch-text-dim)] leading-relaxed">
              AI with persistent memory.
              <br />
              Built for creators.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-[var(--conch-text)] mb-4 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] transition-colors"
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--conch-border)] text-center">
          <p className="text-xs text-[var(--conch-text-dim)]">
            © {new Date().getFullYear()} Conch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
