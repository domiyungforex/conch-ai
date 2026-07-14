"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GradientText } from "@/components/shared/GradientText";

const testimonials = [
  {
    quote: "Conch changed how I work with AI. Every tool I use now knows my context — my stack, my goals, my style. It's like having a senior engineer who never forgets.",
    name: "Alex Chen",
    title: "Founder at BuildFast.ai",
    avatar: "",
    initials: "AC",
    gradient: "from-coral-500 to-gold-500",
  },
  {
    quote: "I've tried every AI memory tool. Conch is the only one that feels like it actually understands the ownership model. My data, my rules. Finally.",
    name: "Sarah Okonkwo",
    title: "Principal Engineer at Scale",
    avatar: "",
    initials: "SO",
    gradient: "from-teal-500 to-blue-500",
  },
  {
    quote: "The portability is wild. I switched AI providers and everything just... worked. My preferences, history, persona — all intact. That's never happened before.",
    name: "Marcus Reyes",
    title: "AI Product Lead at Vercel",
    avatar: "",
    initials: "MR",
    gradient: "from-emerald-500 to-teal-500",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-coral-600/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-coral-400 tracking-widest uppercase mb-4">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Loved by{" "}
            <GradientText>builders</GradientText>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <GlassCard className="p-6 h-full flex flex-col gap-4 hover:bg-white/6 transition-colors">
                <StarRating />
                <p className="text-slate-300 leading-relaxed flex-1 text-sm">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback className={`bg-gradient-to-br ${t.gradient} text-white text-sm font-semibold`}>
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.title}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Social proof numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center"
        >
          {[
            { value: "50K+", label: "Memories stored" },
            { value: "4.9/5", label: "Average rating" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
