import { createAuthMiddleware } from "@market-standard/auth/middleware";

export const middleware = createAuthMiddleware(["/dashboard"]);
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
