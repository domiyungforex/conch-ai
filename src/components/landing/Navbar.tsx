"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden ml-auto text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 glass border-b border-white/10 shadow-2xl md:hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {links.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/sign-up">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
