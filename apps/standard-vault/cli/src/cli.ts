import { Command } from "commander";
import { runCommand } from "./commands/run.js";
import { referencesCommand } from "./commands/references.js";
import { whoamiCommand } from "./commands/whoami.js";

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("ms-vault")
    .description("Env-injection CLI shim for Standard Vault — decrypts project secrets and spawns a child process with them in env.")
    .version("0.0.0");

  program
    .command("run")
    .description("Decrypt a project's secrets and spawn a child process with them in env.")
    .requiredOption("--project <id>", "Vault project ID")
    .requiredOption("--token <token>", "Vault env-injection token")
    .option("--vault-url <url>", "Vault app base URL", process.env.STANDARD_VAULT_URL ?? "http://localhost:3006")
    .option("--dry-run", "Print the env that would be injected, but don't spawn the child")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(async (options, command) => {
      // Pass through trailing args after "--"
      const childArgs = (command as unknown as { args?: string[] }).args ?? [];
      await runCommand({
        projectId: options.project,
        token: options.token,
        vaultUrl: options.vaultUrl,
        dryRun: options.dryRun ?? false,
        childArgs,
      });
    });

  program
    .command("references")
    .description("List an AI-agent reference view of a project's secrets (keys only, no values).")
    .requiredOption("--project <id>", "Vault project ID")
    .option("--vault-url <url>", "Vault app base URL", process.env.STANDARD_VAULT_URL ?? "http://localhost:3006")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      await referencesCommand({
        projectId: options.project,
        vaultUrl: options.vaultUrl,
        asJson: options.json ?? false,
      });
    });

  program
    .command("whoami")
    .description("Verify a vault token is valid and show the project + token metadata.")
    .requiredOption("--project <id>", "Vault project ID")
    .requiredOption("--token <token>", "Vault env-injection token")
    .option("--vault-url <url>", "Vault app base URL", process.env.STANDARD_VAULT_URL ?? "http://localhost:3006")
    .action(async (options) => {
      await whoamiCommand({
        projectId: options.project,
        token: options.token,
        vaultUrl: options.vaultUrl,
      });
    });

  await program.parseAsync(argv, { from: "user" });
}
