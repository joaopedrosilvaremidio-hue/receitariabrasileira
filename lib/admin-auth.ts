import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "receitaria_admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function sign(value: string) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD não configurada.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function verifyPassword(candidate: string) {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_DURATION;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE = COOKIE_NAME;
