import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Every page under src/app/(dashboard)/ — enumerated explicitly rather than
// matching "everything except public routes" so a new public page can never
// accidentally end up behind auth by omission.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/wallet(.*)",
  "/settings(.*)",
  "/opportunities(.*)",
  "/memory(.*)",
  "/chat(.*)",
  "/financial(.*)",
  "/reputation(.*)",
  "/marketplace(.*)",
  "/economic(.*)",
  "/features(.*)",
  "/business(.*)",
  "/agents(.*)",
  "/shared(.*)",
  "/developers(.*)",
  "/creators(.*)",
]);

// Auth pages are only for signed-out users. A signed-in user must never see
// them again (browser back, a typed URL, or a leftover tab) — bounce straight
// to the dashboard, server-side, so the form never even flashes. They only
// become reachable again after signing out.
const isAuthPage = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  const { userId } = await auth();
  if (userId && isAuthPage(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
