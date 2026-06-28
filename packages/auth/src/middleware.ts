import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export function createAuthMiddleware(protectedPrefixes: string[] = ["/dashboard"]) {
  return async function middleware(request: NextRequest) {
    const isLocalDev = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
    if (isLocalDev) {
      return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            supabaseResponse = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              supabaseResponse.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

    if (isProtected && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }

    if (path === "/login" && user) {
      const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
      return NextResponse.redirect(new URL(next, request.url));
    }

    return supabaseResponse;
  };
}

export const authMiddlewareConfig = {
  matcher: ["/dashboard/:path*", "/login"],
};
