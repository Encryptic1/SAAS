import { spawn } from "node:child_process";

interface RunArgs {
  projectId: string;
  token: string;
  vaultUrl: string;
  dryRun: boolean;
  childArgs: string[];
}

interface DecryptResponse {
  secrets: Record<string, string>;
}

interface ApiError {
  error?: string;
}

async function decryptSecrets(vaultUrl: string, projectId: string, token: string): Promise<Record<string, string>> {
  const url = `${vaultUrl.replace(/\/+$/, "")}/api/projects/${encodeURIComponent(projectId)}/decrypt`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(`Vault decrypt failed (${res.status}): ${err.error ?? res.statusText}`);
  }
  const data = (await res.json()) as DecryptResponse;
  return data.secrets;
}

export async function runCommand(args: RunArgs): Promise<void> {
  if (args.childArgs.length === 0 && !args.dryRun) {
    console.error("ms-vault run: no child command specified. Pass it after --, e.g. `ms-vault run --project X --token Y -- npm start`");
    process.exit(2);
  }

  let secrets: Record<string, string>;
  try {
    secrets = await decryptSecrets(args.vaultUrl, args.projectId, args.token);
  } catch (err) {
    console.error(`ms-vault: ${(err as Error).message}`);
    process.exit(1);
  }

  const keys = Object.keys(secrets);
  if (keys.length === 0) {
    console.error(`ms-vault: project ${args.projectId} has no secrets`);
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(`ms-vault: would inject ${keys.length} secret(s) into child env:`);
    for (const k of keys.sort()) {
      const v = secrets[k];
      const masked = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : "****";
      console.log(`  ${k}=${masked}`);
    }
    if (args.childArgs.length > 0) {
      console.log(`ms-vault: child command: ${args.childArgs.join(" ")}`);
    }
    return;
  }

  // Spawn the child with the decrypted secrets merged into env.
  // Existing process env wins over vault secrets — caller can override per-call.
  const childEnv = { ...secrets, ...process.env };
  const [cmd, ...rest] = args.childArgs;
  const child = spawn(cmd, rest, {
    stdio: "inherit",
    env: childEnv,
    shell: process.platform === "win32",
  });

  child.on("error", (err) => {
    console.error(`ms-vault: failed to spawn child: ${err.message}`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}
