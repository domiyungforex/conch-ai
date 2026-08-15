"use client";

import { motion } from "framer-motion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What exactly does Conch remember?",
    a: "Conch extracts four types of memories from your conversations: episodic (specific events), semantic (general knowledge and facts), preference (your likes, dislikes, and settings), and procedural (how-to knowledge). You can also manually add memories at any time.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Your memories are stored with encryption at rest. Only you can access them. We support granular sharing permissions — you choose exactly what to share, with whom, and for how long. You can delete everything instantly.",
  },
  {
    q: "How is this different from ChatGPT or other AI tools?",
    a: "ChatGPT's memory is locked inside OpenAI's platform. Conch gives you a portable, platform-agnostic memory layer that you own and control. You can carry it across different AI services, export it, or verify it on-chain.",
  },
  {
    q: "Do I need a crypto wallet?",
    a: "No. Wallet connection is optional and lets you anchor your memory on-chain for verifiable proof. You can use Conch fully with just an email or Google account.",
  },
  {
    q: "What is a Conch AI Agent?",
    a: "Agents are custom AI personalities you create with specific system prompts, memory scopes, and behavior settings. You might have a coding agent, a writing agent, and a business strategy agent — each with its own context.",
  },
  {
    q: "Can I export my memory?",
    a: "Yes. Pro users can export their complete memory archive as JSON or plaintext. You can also share memory bundles (SharedContexts) with other users or import them into other tools via the Conch API.",
  },
  {
    q: "How does semantic search work?",
    a: "When you search or start a conversation, Conch generates a vector embedding of your query using Voyage AI and ranks it against your stored memories by similarity. The most semantically similar memories are retrieved in milliseconds.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data before cancellation. After account deletion, your data is permanently removed from our servers and vector database within 30 days.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-white/10 text-xs text-slate-400 mb-4">
          FAQ
        </span>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Frequently asked{" "}
          <span className="gradient-text">questions</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Everything you need to know about Conch.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Accordion type="single" collapsible className="space-y-0">
          {faqs.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
