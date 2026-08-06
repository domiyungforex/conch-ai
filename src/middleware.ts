import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
