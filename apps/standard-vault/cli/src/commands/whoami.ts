interface WhoamiArgs {
  projectId: string;
  token: string;
  vaultUrl: string;
}

interface DecryptResponse {
  secrets: Record<string, string>;
}

interface ApiError {
  error?: string;
}

export async function whoamiCommand(args: WhoamiArgs): Promise<void> {
  const url = `${args.vaultUrl.replace(/\/+$/, "")}/api/projects/${encodeURIComponent(args.projectId)}/decrypt`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: args.token }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ApiError;
    console.error(`ms-vault: token invalid (${res.status}): ${err.error ?? res.statusText}`);
    process.exit(1);
  }
  const data = (await res.json()) as DecryptResponse;
  const keys = Object.keys(data.secrets).sort();
  console.log(`ms-vault: token is valid for project ${args.projectId}`);
  console.log(`ms-vault: ${keys.length} secret(s) accessible: ${keys.join(", ")}`);
}
