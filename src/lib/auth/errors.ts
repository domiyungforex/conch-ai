import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

export function getAuthErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage || err.errors[0]?.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
