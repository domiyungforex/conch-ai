"use client";

import { useEffect, useRef } from "react";

// A logarithmic spiral (r = a·e^(bθ)) — the curve a real nautilus shell grows along —
// drawn on canvas rather than hand-authored as an SVG path.
export function NautilusSpiral({ size = 320, className }: { size?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size * 0.62;
    const cy = size * 0.42;
    const a = size / 145;
    const b = 0.18;
    const turns = 3.4;
    const steps = 260;

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#a08cff");
    grad.addColorStop(1, "#e879f9");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * turns * Math.PI * 2;
      const r = a * Math.exp(b * theta);
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className}
      aria-hidden="true"
    />
  );
}
