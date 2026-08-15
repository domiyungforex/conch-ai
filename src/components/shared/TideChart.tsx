"use client";

import { useEffect, useRef } from "react";

interface Props {
  values: number[]; // 0..1
  color?: string;
  height?: number;
  className?: string;
}

// A filled wave line — replaces the old generic audio-equalizer bar chart with
// something that means something in Conch's ocean/shell material world.
export function TideChart({ values, color = "#6d5cff", height = 64, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const draw = () => {
      const w = canvas.clientWidth || 600;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, height);

      const stepX = w / (values.length - 1);
      const pad = 8;
      const yAt = (v: number) => pad + (1 - v) * (height - pad * 2);

      ctx.beginPath();
      values.forEach((v, i) => {
        const x = i * stepX;
        const y = yAt(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(w, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, 0, 0, height);
      const rgb = hexToRgb(color);
      fill.addColorStop(0, `rgba(${rgb}, 0.28)`);
      fill.addColorStop(1, `rgba(${rgb}, 0.02)`);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      values.forEach((v, i) => {
        const x = i * stepX;
        const y = yAt(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke();

      const lastX = (values.length - 1) * stepX;
      const lastY = yAt(values[values.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [values, color, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} className={className} aria-hidden="true" />;
}

function hexToRgb(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
