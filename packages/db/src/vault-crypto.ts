import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption helpers for Standard Vault.
 *
 * The master key (KEK) is read from VAULT_MASTER_KEY (32-byte hex or base64).
 * In local dev, if VAULT_MASTER_KEY is unset, we derive a deterministic key
 * from the literal string "market-standard-vault-local-dev-key" so secrets
 * persist across restarts without requiring the operator to set anything.
 *
 * Each secret value gets:
 *   - a fresh 12-byte random nonce per encryption
 *   - ciphertext + 16-byte GCM auth tag stored as a single base64 blob
 *   - a SHA-256 hash of the plaintext (so we can detect "did this value change?")
 */

const LOCAL_DEV_KEY_MATERIAL = "market-standard-vault-local-dev-key";

function deriveKey(): Buffer {
  const raw = process.env.VAULT_MASTER_KEY;
  if (raw && raw.length > 0) {
    // Accept hex (64 chars = 32 bytes) or base64.
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
    // Fall through to SHA-256 derivation for arbitrary string keys.
    return createHash("sha256").update(raw).digest();
  }
  if (process.env.LOCAL_DEV === "true" || process.env.NEXT_PUBLIC_LOCAL_DEV === "true") {
    return createHash("sha256").update(LOCAL_DEV_KEY_MATERIAL).digest();
  }
  throw new Error("VAULT_MASTER_KEY is required (set it to a 32-byte hex string)");
}

export interface EncryptedValue {
  ciphertext: string; // base64
  nonce: string; // base64
  valueHash: string; // hex
}

export function encryptSecret(plaintext: string): EncryptedValue {
  const key = deriveKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack ciphertext + tag into a single base64 blob (tag is appended last 16 bytes).
  const packed = Buffer.concat([ct, tag]);
  return {
    ciphertext: packed.toString("base64"),
    nonce: nonce.toString("base64"),
    valueHash: createHash("sha256").update(plaintext).digest("hex"),
  };
}

export function decryptSecret(ciphertext: string, nonce: string): string {
  const key = deriveKey();
  const packed = Buffer.from(ciphertext, "base64");
  if (packed.length < 16) throw new Error("ciphertext too short");
  const ct = packed.subarray(0, packed.length - 16);
  const tag = packed.subarray(packed.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(nonce, "base64"));
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; hash: string; last4: string } {
  const bytes = randomBytes(32);
  const token = `msv_${bytes.toString("base64url")}`;
  return { token, hash: hashToken(token), last4: token.slice(-4) };
}
