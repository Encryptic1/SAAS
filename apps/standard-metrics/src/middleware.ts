import { createAuthMiddleware, authMiddlewareConfig } from "@market-standard/auth/middleware";

export const middleware = createAuthMiddleware(["/dashboard"]);
export const config = authMiddlewareConfig;
