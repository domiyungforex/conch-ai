import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  // Dashboard pages
  "/dashboard(.*)",
  "/chat(.*)",
  "/memory(.*)",
  "/agents(.*)",
  "/wallet(.*)",
  "/settings(.*)",
  "/reputation(.*)",
  "/shared(.*)",
  // API routes (webhooks intentionally excluded — they self-verify via svix)
  "/api/chat(.*)",
  "/api/conversations(.*)",
  "/api/memory(.*)",
  "/api/agents(.*)",
  "/api/embeddings(.*)",
  "/api/search(.*)",
  "/api/wallet(.*)",
  "/api/api-keys(.*)",
  "/api/shared-contexts(.*)",
  "/api/user(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
