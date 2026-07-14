"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

type DemoPhase = 0 | 1 | 2;

const PHASE_DURATION = 3800;

const phaseLabels = ["Store Memory", "Recall Memory", "AI Responds"];

const USER_MESSAGE_0 = "Remember that I love cyberpunk design.";
const USER_MESSAGE_1 = "What design style do I like?";
const ASSISTANT_MESSAGE_2 = "You previously told me you love cyberpunk design.";

export function InteractiveMemoryDemo() {
  const [phase, setPhase] = useState<DemoPhase>(0);
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charRef = useRef(0);

  const targetText = phase === 0 ? USER_MESSAGE_0 : phase === 1 ? USER_MESSAGE_1 : "";

  // Phase auto-advance
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPhase((p) => ((p + 1) % 3) as DemoPhase);
    }, PHASE_DURATION);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Reset and retype on phase change
  useEffect(() => {
    if (typeRef.current) clearTimeout(typeRef.current);
    charRef.current = 0;
    setTypedText("");
    setTypingDone(false);

    if (phase === 2) return; // phase 2 shows pre-typed assistant response

    const step = () => {
      charRef.current += 1;
      setTypedText(targetText.slice(0, charRef.current));
      if (charRef.current < targetText.length) {
        typeRef.current = setTimeout(step, 42);
      } else {
        setTypingDone(true);
      }
    };
    typeRef.current = setTimeout(step, 300);
    return () => { if (typeRef.current) clearTimeout(typeRef.current); };
  }, [phase, targetText]);

  const jumpToPhase = (p: DemoPhase) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase(p);
    intervalRef.current = setInterval(() => {
      setPhase((prev) => ((prev + 1) % 3) as DemoPhase);
    }, PHASE_DURATION);
  };

  const assistantWords = ASSISTANT_MESSAGE_2.split(" ");

  return (
    <section id="interactive-demo" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-teal-500/30 text-xs text-teal-300 font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Live Demo
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Watch memory{" "}
            <span className="gradient-text">come alive</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Tell Conch something once. It remembers forever — and recalls it intelligently when you need it.
          </p>
        </motion.div>

        {/* Demo card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="glass rounded-3xl border border-white/10 p-6 md:p-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left: Simulated chat */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Conversation</p>

              {/* Phase 0 — user stores memory */}
              <AnimatePresence mode="popLayout">
                {(phase === 0 || phase === 1 || phase === 2) && (
                  <motion.div
                    key="user-msg-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] bg-coral-600/25 border border-coral-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm text-white">
                        {phase === 0 ? typedText : USER_MESSAGE_0}
                        {phase === 0 && !typingDone && (
                          <span className="inline-block w-0.5 h-4 bg-coral-400 ml-0.5 align-middle animate-pulse" />
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase 0 — stored confirmation */}
              <AnimatePresence>
                {phase === 0 && typingDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-xs text-emerald-400 ml-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Memory stored
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase 1 & 2 — second user question */}
              <AnimatePresence mode="popLayout">
                {(phase === 1 || phase === 2) && (
                  <motion.div
                    key="user-msg-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] bg-coral-600/25 border border-coral-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm text-white">
                        {phase === 1 ? typedText : USER_MESSAGE_1}
                        {phase === 1 && !typingDone && (
                          <span className="inline-block w-0.5 h-4 bg-coral-400 ml-0.5 align-middle animate-pulse" />
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase 1 — thinking dots */}
              <AnimatePresence>
                {phase === 1 && typingDone && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1.5 ml-1"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        className="w-2 h-2 rounded-full bg-slate-500"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase 2 — assistant response */}
              <AnimatePresence>
                {phase === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-coral-600 to-gold-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="max-w-[85%] glass border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-slate-100">
                        {assistantWords.map((word, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.07, duration: 0.25 }}
                          >
                            {word}{" "}
                          </motion.span>
                        ))}
                      </p>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-coral-500"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1.2, repeat: 3 }}
                          className="w-1.5 h-1.5 rounded-full bg-coral-400"
                        />
                        <Brain className="w-3 h-3" />
                        1 memory recalled
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Memory node visualization */}
            <div className="flex flex-col justify-center items-center relative">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6 self-start">
                Memory Store
              </p>

              {/* Memory node card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{
                  opacity: phase === 1 ? 0.55 : 1,
                  y: 0,
                  scale: 1,
                  boxShadow:
                    phase === 2
                      ? "0 0 32px rgba(124,58,237,0.5)"
                      : phase === 0
                      ? "0 0 20px rgba(124,58,237,0.25)"
                      : "none",
                }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                className="relative w-full max-w-xs glass rounded-2xl border border-white/10 p-5"
              >
                {/* Ripple ring on phase 1 */}
                <AnimatePresence>
                  {phase === 1 && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-2xl border border-coral-500/40 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Neural connection line on phase 2 */}
                <AnimatePresence>
                  {phase === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 pointer-events-none hidden md:block"
                    >
                      <svg width="32" height="2" viewBox="0 0 32 2">
                        <line
                          x1="0"
                          y1="1"
                          x2="32"
                          y2="1"
                          stroke="rgba(124,58,237,0.6)"
                          strokeWidth="1.5"
                          className="neural-line"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 tracking-widest">PREFERENCE</span>
                </div>
                <p className="text-sm text-white font-medium mb-1">Loves cyberpunk design</p>
                <p className="text-xs text-slate-500">Stored just now · importance 0.85</p>

                {phase === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 pt-3 border-t border-white/8 flex items-center gap-2 text-xs text-coral-400"
                  >
                    <Brain className="w-3 h-3" />
                    Retrieved for response
                  </motion.div>
                )}
              </motion.div>

              {/* Glow halo on phase 0 stored */}
              <AnimatePresence>
                {phase === 0 && typingDone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Vector indexed · embedding stored
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Phase progress dots */}
          <div className="flex items-center justify-center gap-3 mt-10">
            {([0, 1, 2] as DemoPhase[]).map((p) => (
              <button
                key={p}
                onClick={() => jumpToPhase(p)}
                className="flex items-center gap-2 group"
                aria-label={phaseLabels[p]}
              >
                <motion.div
                  animate={{
                    width: phase === p ? 24 : 8,
                    backgroundColor: phase === p ? "rgb(167,139,250)" : "rgb(71,85,105)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full"
                />
                {phase === p && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-coral-400 font-medium"
                  >
                    {phaseLabels[p]}
                  </motion.span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
