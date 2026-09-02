import { resend, CHALLENGE_EMAILS } from "../resend";
import { waitlistWelcomeEmail } from "./waitlist-welcome";
import { challengeConfirmationEmail } from "./challenge-confirmation";

export async function sendWaitlistWelcomeEmail(
  to: string,
  name: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html } = waitlistWelcomeEmail(name, referralCode);
    const { error } = await resend.emails.send({
      from: CHALLENGE_EMAILS.from,
      to: [to],
      subject,
      html,
      replyTo: CHALLENGE_EMAILS.replyTo,
    });

    if (error) {
      console.error("Resend waitlist email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to send waitlist email:", err);
    return { success: false, error: String(err) };
  }
}

export async function sendChallengeConfirmationEmail(
  to: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html } = challengeConfirmationEmail(name);
    const { error } = await resend.emails.send({
      from: CHALLENGE_EMAILS.from,
      to: [to],
      subject,
      html,
      replyTo: CHALLENGE_EMAILS.replyTo,
    });

    if (error) {
      console.error("Resend challenge email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to send challenge email:", err);
    return { success: false, error: String(err) };
  }
}
