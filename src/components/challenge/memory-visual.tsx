"use client";

import { useEffect, useRef } from "react";

const MEMORY_NODES = [
  { id: "user", label: "YOU", x: 50, y: 8 },
  { id: "conch", label: "CONCH", x: 50, y: 22 },
  { id: "memory", label: "PERSISTENT MEMORY", x: 50, y: 36 },
  { id: "agents", label: "AI AGENTS", x: 50, y: 50 },
  { id: "knowledge", label: "KNOWLEDGE", x: 50, y: 64 },
  { id: "action", label: "ACTION", x: 50, y: 78 },
  { id: "result", label: "NEW EXPERIENCE", x: 50, y: 92 },
];

const SIDE_LABELS = [
  { label: "Context", x: 15, y: 22, delay: 0.5 },
  { label: "Memory", x: 85, y: 36, delay: 1 },
  { label: "Automation", x: 15, y: 50, delay: 1.5 },
  { label: "Insights", x: 85, y: 64, delay: 2 },
  { label: "Learning", x: 15, y: 78, delay: 2.5 },
];

function AnimatedNode({ label, x, y, index }: { label: string; x: number; y: number; index: number }) {
  const isCenter = label === "CONCH";
  const isUser = label === "YOU";

  return (
    <g>
      {/* Glow ring */}
      <circle
        cx={`${x}%`}
        cy={`${y}%`}
        r={isCenter ? 28 : 20}
        fill="none"
        stroke={isCenter ? "#7c3aed" : "#5b21b6"}
        strokeWidth="1"
        opacity="0.3"
        className="animate-node-pulse"
        style={{ animationDelay: `${index * 0.4}s` }}
      />
      {/* Core node */}
      <circle
        cx={`${x}%`}
        cy={`${y}%`}
        r={isCenter ? 16 : isUser ? 14 : 10}
        fill={isCenter ? "#7c3aed" : isUser ? "#a78bfa" : "#1a1a2a"}
        stroke={isCenter ? "#a78bfa" : "#5b21b6"}
        strokeWidth={isCenter ? 2 : 1}
        className="animate-node-pulse"
        style={{ animationDelay: `${index * 0.4}s` }}
      />
      {/* Label */}
      <text
        x={`${x + (x === 50 ? 0 : x < 50 ? -8 : 8)}%`}
        y={`${y}%`}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isCenter ? "#ffffff" : isUser ? "#ffffff" : "#a78bfa"}
        fontSize={isCenter ? 8 : 7}
        fontWeight={isCenter ? "bold" : "600"}
        letterSpacing="0.08em"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

function AnimatedLine({ x1, y1, x2, y2, index }: { x1: number; y1: number; x2: number; y2: number; index: number }) {
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke="#7c3aed"
      strokeWidth="1"
      strokeDasharray="4 4"
      opacity="0.4"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="20"
        to="0"
        dur={`${1.5 + index * 0.1}s`}
        repeatCount="indefinite"
      />
    </line>
  );
}

export function MemoryVisual() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Intersection observer for triggering animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-text-reveal");
          }
        });
      },
      { threshold: 0.3 }
    );

    const elements = svgRef.current?.querySelectorAll(".reveal-item");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 reveal-item">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--conch-text)] mb-4">
            Continuous Intelligence Loop
          </h2>
          <p className="text-[var(--conch-text-muted)] text-lg max-w-xl mx-auto">
            Conch creates a continuous intelligence loop where every interaction
            builds on what came before.
          </p>
        </div>

        {/* Visualization */}
        <div className="relative rounded-2xl border border-[var(--conch-border)] overflow-hidden"
          style={{ background: "rgba(10, 10, 16, 0.6)" }}>
          {/* Loop-back arrow text */}
          <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <svg width="20" height="200" className="hidden md:block">
              <path
                d="M10 180 Q40 100 10 20"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="20"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              <polygon points="6,25 14,25 10,15" fill="#7c3aed" opacity="0.6" />
            </svg>
            <span className="hidden md:block text-[10px] text-[var(--conch-purple-light)] mt-1 tracking-wider rotate-90 origin-center whitespace-nowrap">
              CONTINUOUS MEMORY
            </span>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="w-full"
            style={{ height: "500px", maxHeight: "60vh" }}
          >
            {/* Connection lines */}
            {MEMORY_NODES.slice(0, -1).map((node, i) => (
              <AnimatedLine
                key={`line-${i}`}
                x1={node.x}
                y1={node.y + (i === 0 ? 3 : 2)}
                x2={MEMORY_NODES[i + 1].x}
                y2={MEMORY_NODES[i + 1].y - 2}
                index={i}
              />
            ))}

            {/* Side labels */}
            {SIDE_LABELS.map((item) => (
              <text
                key={item.label}
                x={`${item.x}%`}
                y={`${item.y}%`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#55556a"
                fontSize="5"
                letterSpacing="0.1em"
                style={{
                  fontFamily: "Inter, sans-serif",
                  animation: `float 4s ease-in-out ${item.delay}s infinite`,
                }}
              >
                {item.label}
              </text>
            ))}

            {/* Nodes */}
            {MEMORY_NODES.map((node, i) => (
              <AnimatedNode key={node.id} {...node} index={i} />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
