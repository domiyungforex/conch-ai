export function challengeConfirmationEmail(name: string): { subject: string; html: string } {
  return {
    subject: "🐚 Your Conch Creator Challenge Application is In!",
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
                    <!-- Trophy -->
                    <div style="text-align:center;margin-bottom:24px;">
                      <div style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);width:56px;height:56px;border-radius:50%;line-height:56px;font-size:28px;">🏆</div>
                    </div>

                    <h2 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;text-align:center;">Application Received!</h2>
                    <p style="color:#a78bfa;font-size:14px;text-align:center;margin:0 0 32px;font-weight:500;">${name}, you're now a Conch Creator Challenge applicant</p>

                    <div style="border-top:1px solid rgba(139,92,246,0.15);margin:0 0 32px;"></div>

                    <p style="color:#d1d5db;font-size:16px;line-height:1.7;margin:0 0 20px;">
                      Your application to the <strong style="color:#ffffff;">Conch Creator Challenge</strong> has been received. We're excited to see what you'll build with persistent AI memory.
                    </p>

                    <p style="color:#d1d5db;font-size:16px;line-height:1.7;margin:0 0 24px;">
                      <strong style="color:#ffffff;">Your challenge journey:</strong>
                    </p>

                    <!-- Steps -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;height:36px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#22c55e;font-weight:700;">✓</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">Application submitted</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;height:36px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">2</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">Get access to the Conch platform</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;height:36px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">3</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">Build with persistent memory & agents</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;height:36px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:8px;text-align:center;vertical-align:middle;font-size:14px;color:#8b5cf6;font-weight:700;">4</td>
                              <td style="padding-left:16px;color:#d1d5db;font-size:15px;line-height:1.5;">Submit & compete for <strong style="color:#fbbf24;">$5,000</strong></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Prize highlight -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(251,191,36,0.08) 0%,rgba(245,158,11,0.05) 100%);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:24px;margin:0 0 24px;">
                      <tr>
                        <td align="center">
                          <p style="color:#fbbf24;font-size:13px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Prize Fund</p>
                          <p style="color:#ffffff;font-size:32px;font-weight:800;margin:0;">$5,000</p>
                          <p style="color:#9ca3af;font-size:13px;margin:8px 0 0;">🥇 $2,500 · 🥈 $1,500 · 🥉 $1,000</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0;">
                          <a href="https://conchportal.com/challenge/dashboard" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.5px;">
                            Go to Dashboard →
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:8px 0;">
                          <a href="https://conchportal.com/challenge" style="display:inline-block;color:#8b5cf6;font-size:14px;font-weight:500;text-decoration:none;padding:8px;">
                            View Challenge Rules
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
                Build something worth remembering.
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
