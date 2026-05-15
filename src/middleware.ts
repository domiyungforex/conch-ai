import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/chat(.*)",
  "/memory(.*)",
  "/agents(.*)",
  "/wallet(.*)",
  "/settings(.*)",
  "/api/chat(.*)",
  "/api/conversations(.*)",
  "/api/memory(.*)",
  "/api/agents(.*)",
  "/api/embeddings(.*)",
  "/api/search(.*)",
  "/api/wallet(.*)",
  "/api/api-keys(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)","/(api|trpc)(.*)"],
};
