"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Show } from "@clerk/nextjs";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Business", href: "/business" },
  { label: "Creators", href: "/creators" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Community", href: "/community" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b border-white/8 shadow-xl" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-8">
          <Logo />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <Show when="signed-out">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Start Remembering</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu size="sm" />
            </Show>
          </div>

          {/* Mobile: a single clear CTA, no menu */}
          <div className="md:hidden ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Show when="signed-out">
              <Button size="sm" asChild>
                <Link href="/sign-up">Start Remembering</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
