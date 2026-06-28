interface ReferencesArgs {
  projectId: string;
  vaultUrl: string;
  asJson: boolean;
}

interface ReferenceRow {
  key: string;
  version: number;
  notes: string | null;
  lastRotatedAt: string | null;
}

interface ReferencesResponse {
  references: ReferenceRow[];
}

export async function referencesCommand(args: ReferencesArgs): Promise<void> {
  const url = `${args.vaultUrl.replace(/\/+$/, "")}/api/projects/${encodeURIComponent(args.projectId)}/references`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`ms-vault: references failed (${res.status}): ${res.statusText}`);
    process.exit(1);
  }
  const data = (await res.json()) as ReferencesResponse;
  if (args.asJson) {
    console.log(JSON.stringify(data.references, null, 2));
    return;
  }
  if (data.references.length === 0) {
    console.log(`ms-vault: project ${args.projectId} has no agent-referenceable secrets`);
    return;
  }
  console.log(`ms-vault: ${data.references.length} agent-referenceable secret(s) in project ${args.projectId}:`);
  for (const r of data.references) {
    const rotated = r.lastRotatedAt ? ` · rotated ${new Date(r.lastRotatedAt).toISOString().slice(0, 10)}` : "";
    const notes = r.notes ? ` · ${r.notes}` : "";
    console.log(`  ${r.key} (v${r.version}${rotated}${notes})`);
  }
}
