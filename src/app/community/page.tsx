import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WorldUserMap } from "@/components/community/WorldUserMap";

export const metadata: Metadata = {
  title: "Community",
  description: "Where Conch is used, live. Real signups, real countries, updating as they happen.",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <WorldUserMap />
      </main>
      <Footer />
    </div>
  );
}
