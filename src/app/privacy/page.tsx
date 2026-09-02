import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Conch Portal",
  description: "Privacy policy for Conch Portal and the Creator Challenge.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf7f1] text-[#241b10]">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-[#83775f] mb-12">Last updated: September 2, 2026</p>

        <div className="space-y-8 text-[#3d3022] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p>When you use Conch Portal or join the Creator Challenge waitlist, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account information:</strong> Name, email address, authentication credentials</li>
              <li><strong>Profile information:</strong> X/Twitter handle, Discord username, role, country</li>
              <li><strong>Usage data:</strong> Pages visited, features used, API calls made</li>
              <li><strong>Challenge data:</strong> Projects submitted, build ideas, submission content</li>
              <li><strong>Technical data:</strong> IP address, browser type, device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve the Conch platform and Creator Challenge</li>
              <li>Communicate about challenge updates, deadlines, and results</li>
              <li>Process submissions and evaluate projects for judging</li>
              <li>Prevent fraud and ensure fair competition</li>
              <li>Analyze usage patterns to improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With judges for challenge evaluation (project details only)</li>
              <li>Publicly if you win or your project is featured (with attribution)</li>
              <li>As required by law or to protect legal rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Storage</h2>
            <p>Your data is stored securely using Appwrite cloud infrastructure. We implement appropriate security measures to protect your information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Children&apos;s Privacy</h2>
            <p>The service is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Changes to This Policy</h2>
            <p>We may update this policy at any time. We will notify you of significant changes via email or on the site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact</h2>
            <p>Privacy questions? Contact us at <a href="mailto:privacy@conchportal.com" className="text-[#c8891f] underline">privacy@conchportal.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
