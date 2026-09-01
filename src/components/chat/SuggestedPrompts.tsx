"use client";

import { motion } from "framer-motion";
import { Brain, Settings, Star, Zap } from "lucide-react";

interface Props {
  onSelect: (prompt: string) => void;
}

const prompts = [
  { icon: Brain,    text: "What do you remember about me?", color: "text-coral-400", bg: "bg-coral-500/10", border: "border-coral-500/20" },
  { icon: Settings, text: "Set a new preference",           color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/20" },
  { icon: Star,     text: "Show my recent memories",        color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  { icon: Zap,      text: "Create a new goal",              color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function SuggestedPrompts({ onSelect }: Props) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
    >
      {prompts.map(({ icon: Icon, text, color, bg, border }) => (
        <motion.div key={text} variants={cardVariants}>
          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(text)}
            className={`w-full text-left glass rounded-2xl border ${border} p-4 group transition-colors hover:bg-white/5`}
          >
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">
              {text}
            </p>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}
