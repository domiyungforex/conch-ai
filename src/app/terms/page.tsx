import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Conch Portal",
  description: "Terms of service for Conch Portal and the Creator Challenge.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf7f1] text-[#241b10]">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-[#83775f] mb-12">Last updated: September 2, 2026</p>

        <div className="space-y-8 text-[#3d3022] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Conch Portal (conchportal.com), including the Creator Challenge, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p>Conch is an AI platform built around persistent memory, AI agents, personal context, knowledge, and continuity. Conch Portal provides access to the Conch platform, including the Creator Challenge competition.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Creator Challenge</h2>
            <p>The Creator Challenge is a skill-based competition where builders create projects using Conch&apos;s persistent memory and agent infrastructure. Participation does not require payment beyond a Conch subscription, which provides genuine access to the platform.</p>
            <p className="mt-3">Prizes are awarded based on published judging criteria. Winners are selected by judges, not by random drawing. The challenge is not a lottery, gambling activity, or investment opportunity.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Eligibility</h2>
            <p>The Creator Challenge is open to developers, creators, founders, students, and anyone who can build with Conch&apos;s platform. Participants must be at least 18 years old or have parental consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Submissions</h2>
            <p>By submitting a project, you represent that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You created the project and own the intellectual property</li>
              <li>The project uses Conch&apos;s platform in a meaningful way</li>
              <li>All information provided is accurate and complete</li>
              <li>You have the right to submit the project</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Prizes</h2>
            <p>Prize amounts are as published at the time of the challenge. Prize eligibility, judging, submission requirements, dates, and payment conditions are governed by the official challenge rules. Prizes are awarded to the primary submitter of each winning project.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
            <p>You retain ownership of your submitted projects. By submitting, you grant Conch a non-exclusive license to display, promote, and share your project for marketing and community purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Prohibited Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submitting work that is not your own</li>
              <li>Manipulating votes, shares, or referral counts</li>
              <li>Using the service for illegal purposes</li>
              <li>Attempting to hack, exploit, or disrupt the service</li>
              <li>Misrepresenting your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
            <p>Conch is provided &quot;as is&quot; without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:support@conchportal.com" className="text-[#c8891f] underline">support@conchportal.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
