import {
  fetchGateway,
  getDbAsync,
  isLocalGatewayMode,
  postGateway,
  patchGateway,
  deleteGateway,
} from "@market-standard/db";
import { vaultProjects, vaultSecrets, vaultAuditLog, vaultTokens } from "@market-standard/db/schema/vault";
import { encryptSecret, decryptSecret, hashToken, generateToken } from "@market-standard/db/vault-crypto";
import { and, eq } from "@market-standard/db/query";

export type VaultProjectSummary = {
  id: string;
  name: string;
  environment: string;
  githubRepo: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VaultSecretSummary = {
  id: string;
  projectId: string;
  key: string;
  valueHash: string | null;
  version: number;
  agentReference: boolean;
  notes: string | null;
  lastRotatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VaultTokenMeta = {
  id: string;
  name: string;
  last4: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export async function listOwnerProjects(ownerId: string): Promise<VaultProjectSummary[]> {
  if (isLocalGatewayMode()) {
    const url = `/vault/projects?ownerId=${encodeURIComponent(ownerId)}`;
    const data = await fetchGateway<{ projects: VaultProjectSummary[] }>(url);
    return data.projects.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(vaultProjects)
    .where(eq(vaultProjects.ownerId, ownerId));
  return rows;
}

export async function getProject(id: string, ownerId: string): Promise<VaultProjectSummary | null> {
  if (isLocalGatewayMode()) {
    const all = await listOwnerProjects(ownerId);
    return all.find((p) => p.id === id) ?? null;
  }
  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(vaultProjects)
    .where(and(eq(vaultProjects.id, id), eq(vaultProjects.ownerId, ownerId)))
    .limit(1);
  return row ?? null;
}

export async function createProject(input: {
  ownerId: string;
  name: string;
  environment?: string;
  githubRepo?: string | null;
  description?: string | null;
}): Promise<VaultProjectSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ project: VaultProjectSummary }>("/vault/projects", input);
    return data.project ? { ...data.project, createdAt: new Date(data.project.createdAt), updatedAt: new Date(data.project.updatedAt) } : null;
  }
  const db = await getDbAsync();
  const [row] = await db
    .insert(vaultProjects)
    .values({
      ownerId: input.ownerId,
      name: input.name,
      environment: input.environment ?? "production",
      githubRepo: input.githubRepo ?? null,
      description: input.description ?? null,
    })
    .returning();
  return row ?? null;
}

export async function updateProject(
  id: string,
  ownerId: string,
  updates: { name?: string; environment?: string; githubRepo?: string | null; description?: string | null },
): Promise<VaultProjectSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await patchGateway<{ project: VaultProjectSummary }>(`/vault/projects/${id}`, updates);
    return data.project ? { ...data.project, createdAt: new Date(data.project.createdAt), updatedAt: new Date(data.project.updatedAt) } : null;
  }
  const db = await getDbAsync();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) set.name = updates.name;
  if (updates.environment !== undefined) set.environment = updates.environment;
  if (updates.githubRepo !== undefined) set.githubRepo = updates.githubRepo;
  if (updates.description !== undefined) set.description = updates.description;
  const [row] = await db
    .update(vaultProjects)
    .set(set)
    .where(and(eq(vaultProjects.id, id), eq(vaultProjects.ownerId, ownerId)))
    .returning();
  return row ?? null;
}

export async function deleteProject(id: string, ownerId: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/vault/projects/${id}`);
    return;
  }
  const db = await getDbAsync();
  await db
    .delete(vaultProjects)
    .where(and(eq(vaultProjects.id, id), eq(vaultProjects.ownerId, ownerId)));
}

export async function listProjectSecrets(projectId: string): Promise<VaultSecretSummary[]> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ secrets: VaultSecretSummary[] }>(`/vault/projects/${projectId}/secrets`);
    return data.secrets.map((s) => ({
      ...s,
      lastRotatedAt: s.lastRotatedAt ? new Date(s.lastRotatedAt) : null,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select({
      id: vaultSecrets.id,
      projectId: vaultSecrets.projectId,
      key: vaultSecrets.key,
      valueHash: vaultSecrets.valueHash,
      version: vaultSecrets.version,
      agentReference: vaultSecrets.agentReference,
      notes: vaultSecrets.notes,
      lastRotatedAt: vaultSecrets.lastRotatedAt,
      createdAt: vaultSecrets.createdAt,
      updatedAt: vaultSecrets.updatedAt,
    })
    .from(vaultSecrets)
    .where(eq(vaultSecrets.projectId, projectId));
  return rows;
}

export async function createSecret(input: {
  projectId: string;
  key: string;
  value: string;
  agentReference?: boolean;
  notes?: string | null;
}): Promise<VaultSecretSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ secret: VaultSecretSummary }>(`/vault/projects/${input.projectId}/secrets`, {
      key: input.key,
      value: input.value,
      agentReference: input.agentReference ?? false,
      notes: input.notes ?? null,
    });
    return data.secret
      ? {
          ...data.secret,
          lastRotatedAt: data.secret.lastRotatedAt ? new Date(data.secret.lastRotatedAt) : null,
          createdAt: new Date(data.secret.createdAt),
          updatedAt: new Date(data.secret.updatedAt),
        }
      : null;
  }
  const db = await getDbAsync();
  const enc = encryptSecret(input.value);
  const [row] = await db
    .insert(vaultSecrets)
    .values({
      projectId: input.projectId,
      key: input.key,
      ciphertext: enc.ciphertext,
      nonce: enc.nonce,
      valueHash: enc.valueHash,
      agentReference: input.agentReference ?? false,
      notes: input.notes ?? null,
    })
    .returning();
  if (!row) return null;
  await db.insert(vaultAuditLog).values({
    projectId: input.projectId,
    secretId: row.id,
    action: "create",
    actor: "owner",
    metadata: { key: input.key },
  });
  return {
    id: row.id,
    projectId: row.projectId,
    key: row.key,
    valueHash: row.valueHash,
    version: row.version,
    agentReference: row.agentReference,
    notes: row.notes,
    lastRotatedAt: row.lastRotatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateSecret(
  id: string,
  projectId: string,
  updates: { value?: string; agentReference?: boolean; notes?: string | null },
): Promise<VaultSecretSummary | null> {
  if (isLocalGatewayMode()) {
    const data = await patchGateway<{ secret: VaultSecretSummary }>(`/vault/secrets/${id}`, updates);
    return data.secret
      ? {
          ...data.secret,
          lastRotatedAt: data.secret.lastRotatedAt ? new Date(data.secret.lastRotatedAt) : null,
          createdAt: new Date(data.secret.createdAt),
          updatedAt: new Date(data.secret.updatedAt),
        }
      : null;
  }
  const db = await getDbAsync();
  const [existing] = await db
    .select()
    .from(vaultSecrets)
    .where(and(eq(vaultSecrets.id, id), eq(vaultSecrets.projectId, projectId)))
    .limit(1);
  if (!existing) return null;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.value !== undefined) {
    const enc = encryptSecret(updates.value);
    set.ciphertext = enc.ciphertext;
    set.nonce = enc.nonce;
    set.valueHash = enc.valueHash;
    set.version = (existing.version ?? 1) + 1;
    set.lastRotatedAt = new Date();
  }
  if (updates.agentReference !== undefined) set.agentReference = updates.agentReference;
  if (updates.notes !== undefined) set.notes = updates.notes;
  const [row] = await db.update(vaultSecrets).set(set).where(eq(vaultSecrets.id, id)).returning();
  if (!row) return null;
  await db.insert(vaultAuditLog).values({
    projectId,
    secretId: id,
    action: updates.value !== undefined ? "rotate" : "update",
    actor: "owner",
    metadata: { key: existing.key, version: row.version },
  });
  return {
    id: row.id,
    projectId: row.projectId,
    key: row.key,
    valueHash: row.valueHash,
    version: row.version,
    agentReference: row.agentReference,
    notes: row.notes,
    lastRotatedAt: row.lastRotatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function deleteSecret(id: string, projectId: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/vault/secrets/${id}`);
    return;
  }
  const db = await getDbAsync();
  const [existing] = await db
    .select()
    .from(vaultSecrets)
    .where(and(eq(vaultSecrets.id, id), eq(vaultSecrets.projectId, projectId)))
    .limit(1);
  if (!existing) return;
  await db.delete(vaultSecrets).where(eq(vaultSecrets.id, id));
  await db.insert(vaultAuditLog).values({
    projectId,
    secretId: id,
    action: "delete",
    actor: "owner",
    metadata: { key: existing.key },
  });
}

/** Decrypt all secrets for a project — used by the env-injection CLI shim. */
export async function decryptProjectSecrets(
  projectId: string,
  token: string,
): Promise<Record<string, string> | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ secrets: Record<string, string> }>(`/vault/projects/${projectId}/decrypt`, {
      token,
    });
    return data.secrets;
  }
  const db = await getDbAsync();
  const hash = hashToken(token);
  const [tok] = await db.select().from(vaultTokens).where(eq(vaultTokens.tokenHash, hash)).limit(1);
  if (!tok || tok.projectId !== projectId) return null;
  if (tok.expiresAt && new Date(tok.expiresAt) < new Date()) return null;
  await db.update(vaultTokens).set({ lastUsedAt: new Date() }).where(eq(vaultTokens.id, tok.id));
  const rows = await db.select().from(vaultSecrets).where(eq(vaultSecrets.projectId, projectId));
  const out: Record<string, string> = {};
  for (const r of rows) {
    out[r.key] = decryptSecret(r.ciphertext, r.nonce);
  }
  await db.insert(vaultAuditLog).values({
    projectId,
    action: "decrypt",
    actor: `token:${tok.last4}`,
    metadata: { count: rows.length },
  });
  return out;
}

/** Owner-authorized dotenv export — verifies ownership, returns decrypted KEY=value map. */
export async function getProjectDotenv(
  projectId: string,
  ownerId: string,
): Promise<Record<string, string> | null> {
  const project = await getProject(projectId, ownerId);
  if (!project) return null;

  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ values: Record<string, string> }>(`/vault/projects/${projectId}/dotenv`);
    return data.values;
  }

  const db = await getDbAsync();
  const rows = await db
    .select({ key: vaultSecrets.key, ciphertext: vaultSecrets.ciphertext, nonce: vaultSecrets.nonce })
    .from(vaultSecrets)
    .where(eq(vaultSecrets.projectId, projectId))
    .orderBy(vaultSecrets.key);
  const out: Record<string, string> = {};
  for (const r of rows) {
    out[r.key] = decryptSecret(r.ciphertext, r.nonce);
  }
  await db.insert(vaultAuditLog).values({
    projectId,
    action: "dotenv_export",
    actor: "owner",
    metadata: { count: rows.length },
  });
  return out;
}

/** AI-agent reference mode — keys + versions only, no values. */
export async function listProjectReferences(
  projectId: string,
): Promise<Array<{ key: string; version: number; notes: string | null; lastRotatedAt: Date | null }>> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ references: Array<{ key: string; version: number; notes: string | null; lastRotatedAt: string | null }> }>(`/vault/projects/${projectId}/references`);
    return data.references.map((r) => ({ ...r, lastRotatedAt: r.lastRotatedAt ? new Date(r.lastRotatedAt) : null }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select({
      key: vaultSecrets.key,
      version: vaultSecrets.version,
      notes: vaultSecrets.notes,
      lastRotatedAt: vaultSecrets.lastRotatedAt,
    })
    .from(vaultSecrets)
    .where(and(eq(vaultSecrets.projectId, projectId), eq(vaultSecrets.agentReference, true)));
  return rows;
}

export async function createToken(input: {
  projectId: string;
  name: string;
  scopes?: string[];
  expiresInDays?: number | null;
}): Promise<{ token: string; meta: VaultTokenMeta } | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ token: string; tokenMeta: VaultTokenMeta }>(`/vault/projects/${input.projectId}/tokens`, input);
    if (!data.token || !data.tokenMeta) return null;
    return {
      token: data.token,
      meta: {
        ...data.tokenMeta,
        lastUsedAt: data.tokenMeta.lastUsedAt ? new Date(data.tokenMeta.lastUsedAt) : null,
        expiresAt: data.tokenMeta.expiresAt ? new Date(data.tokenMeta.expiresAt) : null,
        createdAt: new Date(data.tokenMeta.createdAt),
      },
    };
  }
  const db = await getDbAsync();
  const { token, hash, last4 } = generateToken();
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  const [row] = await db
    .insert(vaultTokens)
    .values({
      projectId: input.projectId,
      name: input.name,
      tokenHash: hash,
      last4,
      scopes: input.scopes ?? ["read"],
      expiresAt,
    })
    .returning();
  if (!row) return null;
  await db.insert(vaultAuditLog).values({
    projectId: input.projectId,
    action: "token_create",
    actor: "owner",
    metadata: { name: input.name, last4 },
  });
  return {
    token,
    meta: {
      id: row.id,
      name: row.name,
      last4: row.last4,
      scopes: row.scopes,
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    },
  };
}

export async function listProjectTokens(projectId: string): Promise<VaultTokenMeta[]> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ tokens: VaultTokenMeta[] }>(`/vault/projects/${projectId}/tokens`);
    return data.tokens.map((t) => ({
      ...t,
      lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : null,
      expiresAt: t.expiresAt ? new Date(t.expiresAt) : null,
      createdAt: new Date(t.createdAt),
    }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select({
      id: vaultTokens.id,
      name: vaultTokens.name,
      last4: vaultTokens.last4,
      scopes: vaultTokens.scopes,
      lastUsedAt: vaultTokens.lastUsedAt,
      expiresAt: vaultTokens.expiresAt,
      createdAt: vaultTokens.createdAt,
    })
    .from(vaultTokens)
    .where(eq(vaultTokens.projectId, projectId));
  return rows;
}

export async function deleteToken(id: string): Promise<void> {
  if (isLocalGatewayMode()) {
    await deleteGateway(`/vault/tokens/${id}`);
    return;
  }
  const db = await getDbAsync();
  await db.delete(vaultTokens).where(eq(vaultTokens.id, id));
}

export async function listAuditLog(projectId: string): Promise<Array<{
  id: string;
  secretId: string | null;
  action: string;
  actor: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}>> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ audit: Array<{ id: string; secretId: string | null; action: string; actor: string; metadata: Record<string, unknown> | null; createdAt: string }> }>(`/vault/projects/${projectId}/audit`);
    return data.audit.map((a) => ({ ...a, createdAt: new Date(a.createdAt) }));
  }
  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(vaultAuditLog)
    .where(eq(vaultAuditLog.projectId, projectId))
    .limit(100);
  return rows;
}
