import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

/**
 * Service-role admin client (bypasses RLS). Used for SSO code redemption.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
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

/**
 * Redeem a FloodG8 SSO code from shared.sso_codes.
 *
 * Flow:
 * 1. Look up the code in shared.sso_codes (not used, not expired)
 * 2. Fetch the user's email via admin.getUserById
 * 3. Generate a magiclink token via admin.generateLink
 * 4. Delete the consumed sso_codes row
 * 5. Verify the OTP on the server client to set session cookies
 *
 * Returns { success: true } on success, or { success: false, reason } on failure.
 * "code_not_found" — the code doesn't exist, is used, or is expired (caller should
 * fall back to standard OAuth exchangeCodeForSession).
 */
export async function redeemSsoCode(
  code: string,
): Promise<{ success: boolean; reason?: string }> {
  if (isLocalDev()) {
    return { success: false, reason: "local_dev" };
  }

  const serverClient = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // 1. Look up the SSO code
  const { data: ssoRow, error: queryError } = await admin
    .from("sso_codes")
    .select("id, user_id, expires_at, used")
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (queryError || !ssoRow) {
    return { success: false, reason: "code_not_found" };
  }

  // 2. Fetch the user's email
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(
    ssoRow.user_id,
  );
  if (userError || !userData?.user?.email) {
    return { success: false, reason: "user_not_found" };
  }

  // 3. Generate a magiclink token (does not send an email)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    return { success: false, reason: "link_generation_failed" };
  }

  // 4. Delete the consumed SSO code
  await admin.from("sso_codes").delete().eq("id", ssoRow.id);

  // 5. Verify the OTP to set session cookies
  const { error: verifyError } = await serverClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
    email: userData.user.email,
  });

  if (verifyError) {
    return { success: false, reason: "session_creation_failed" };
  }

  return { success: true };
}
