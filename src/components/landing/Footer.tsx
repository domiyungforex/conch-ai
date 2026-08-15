"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Github, Twitter } from "lucide-react";

const links = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Business", href: "/business" },
    { label: "Creators", href: "/creators" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Community", href: "/community" },
    { label: "API", href: "/settings/api-keys" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "mailto:hello@conch.ai" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#070a13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo className="mb-4" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Own your AI memory. Carry it across every platform, device, and chain — remembered everywhere, forgotten never.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Conch on Twitter"
                className="w-9 h-9 glass border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Conch on GitHub"
                className="w-9 h-9 glass border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Conch. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Built by</span>
            <span className="gradient-text font-semibold mx-1">DMON</span>
            <span>with ♥ for the CONCH</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
