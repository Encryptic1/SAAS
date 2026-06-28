import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const LOCAL_DEV_USER: User = {
  id: "local-dev-user",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "local-dev" },
  user_metadata: { full_name: "Local Dev" },
  identities: [],
  created_at: new Date(0).toISOString(),
} as unknown as User;

function isLocalDev(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from Server Component — ignore
          }
        },
      },
    },
  );
}

export async function getSession(): Promise<Session | null> {
  if (isLocalDev()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser(): Promise<User | null> {
  if (isLocalDev()) return LOCAL_DEV_USER;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
