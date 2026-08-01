import { ImageResponse } from "next/og";
import { BrandOgImage } from "@/lib/brandOgImage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Conch — Own Your AI Memory";

export default function TwitterImage() {
  return new ImageResponse(<BrandOgImage />, { ...size });
}
