import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { InteractiveMemoryDemo } from "@/components/landing/InteractiveMemoryDemo";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { MemoryOwnershipSection } from "@/components/landing/MemoryOwnershipSection";
import { AIPortabilitySection } from "@/components/landing/AIPortabilitySection";
import { MemoryGraph } from "@/components/landing/MemoryGraph";
import { PrivacySection } from "@/components/landing/PrivacySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <InteractiveMemoryDemo />
        <BenefitsSection />
        <HowItWorksSection />
        <MemoryOwnershipSection />
        <AIPortabilitySection />
        <MemoryGraph />
        <PrivacySection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
