export function waitlistWelcomeEmail(name: string, referralCode: string): { subject: string; html: string } {
  return {
    subject: "🐚 You're on the Conch Creator Challenge Waitlist!",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 40px 0;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🐚</div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">CONCH</h1>
              <p style="color:#8b5cf6;font-size:12px;font-weight:500;margin:4px 0 0;letter-spacing:3px;text-transform:uppercase;">Creator Challenge</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1028 0%,#0f0a1a 100%);border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:48px 40px;">
                <tr>
                  <td>
                    <h2 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;text-align:center;">You're In, ${name}! 🎉</h2>
                    <p style="color:#a78bfa;font-size:14px;text-align:center;margin:0 0 32px;font-weight:500;">Welcome to the Conch Creator Challenge waitlist</p>

                    <div style="border-top:1px solid rgba(139,92,246,0.15);margin:0 0 32px;"></div>

                    <p style="color:#d1d5db;font-size:16px;line-height:1.7;margin:0 0 20px;">
                      Thank you for joining the <strong style="color:#ffffff;">Conch Creator Challenge</strong> waitlist. You're now part of a growing community of builders who believe AI should remember.
                    </p>

                    <p style="color:#d1d5db;font-size:16px;line-height:1.7;margin:0 0 20px;">
                      <strong style="color:#ffffff;">What happens next?</strong>
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;height:32px;background:rgba(139,92,246,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">1</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">We'll notify you when applications open</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;height:32px;background:rgba(139,92,246,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">2</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">You'll get early access to the Conch platform</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;height:32px;background:rgba(139,92,246,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">3</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">Build something with <strong style="color:#ffffff;">$5,000</strong> on the line</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Referral Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;margin:0 0 24px;">
                      <tr>
                        <td>
                          <p style="color:#a78bfa;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your Referral Code</p>
                          <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;font-family:monospace;letter-spacing:2px;">${referralCode}</p>
                          <p style="color:#9ca3af;font-size:13px;margin:8px 0 0;">Share this code with friends. The more builders join, the stronger the community.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0;">
                          <a href="https://conchportal.com/challenge" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.5px;">
                            Explore the Challenge →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:40px 0 0;text-align:center;">
              <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">
                AI that remembers. Your context shouldn't disappear.
              </p>
              <p style="color:#4b5563;font-size:12px;margin:0;">
                <a href="https://conchportal.com" style="color:#8b5cf6;text-decoration:none;">conchportal.com</a>
                &nbsp;·&nbsp;
                <a href="https://conchportal.com/privacy" style="color:#8b5cf6;text-decoration:none;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="https://conchportal.com/terms" style="color:#8b5cf6;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
