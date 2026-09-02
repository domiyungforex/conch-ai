import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set. Emails will not be sent.");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Export a proxy that only initializes when actually called
export const resend = {
  get emails() {
    return getResendClient().emails;
  },
};

export const CHALLENGE_EMAILS = {
  // Once conchportal.com is verified in Resend dashboard, switch to: Conch Challenge <challenge@conchportal.com>
  from: "Conch Challenge <onboarding@resend.dev>",
  replyTo: "challenge@conchportal.com",
} as const;
