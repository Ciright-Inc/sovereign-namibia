import bcrypt from "bcryptjs";
import { verifyPassword } from "@/lib/crypto";

const BCRYPT_ROUNDS = 12;

export function hashAdminPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyAdminPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compareSync(password, storedHash);
  }
  return verifyPassword(password, storedHash);
}

export function getAdminEmailDomain(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sovereignnamibia.com";
  try {
    const host = new URL(appUrl).hostname.replace(/^www\./, "");
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return "sovereignnamibia.com";
    }
    return host;
  } catch {
    return "sovereignnamibia.com";
  }
}

export function getDefaultAdminEmail(): string {
  return `admin@${getAdminEmailDomain()}`;
}
