import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY must be a 64-character hex string");
    }
    return crypto.createHash("sha256").update("dev-sovereign-namibia-key").digest();
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decrypt(ciphertext: Buffer): string {
  const key = getEncryptionKey();
  const iv = ciphertext.subarray(0, IV_LENGTH);
  const tag = ciphertext.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = ciphertext.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function createAuditHash(payload: Record<string, unknown>): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload) + Date.now())
    .digest("hex");
}

export function createSignedUploadUrl(documentId: string, expiresMs = 900_000): string {
  const expires = Date.now() + expiresMs;
  const payload = `${documentId}:${expires}`;
  const sig = crypto
    .createHmac("sha256", getEncryptionKey())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySignedUploadUrl(token: string, documentId: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [id, expiresStr, sig] = decoded.split(":");
    if (id !== documentId) return false;
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return false;
    const expected = crypto
      .createHmac("sha256", getEncryptionKey())
      .update(`${id}:${expiresStr}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
