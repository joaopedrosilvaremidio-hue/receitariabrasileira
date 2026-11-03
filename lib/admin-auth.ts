import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "node:crypto";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";

const COOKIE_NAME = "receitaria_admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
export type AdminSession = { id: string; role: "owner" | "admin"; username: string; name: string };
function secret() { const value = process.env.ADMIN_PASSWORD; if (!value) throw new Error("ADMIN_PASSWORD não configurada."); return value; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }
export function verifyPassword(candidate: string) {
  const actual = process.env.ADMIN_PASSWORD; if (!actual || !candidate) return false;
  const a=Buffer.from(candidate), b=Buffer.from(actual); return a.length===b.length && timingSafeEqual(a,b);
}
export function hashAdminPassword(password: string) {
  const salt=randomBytes(16).toString("hex"); const hash=scryptSync(password,salt,64).toString("hex"); return `scrypt:${salt}:${hash}`;
}
export function verifyAdminPassword(password: string, stored: string) {
  try { const [algorithm,salt,hash]=stored.split(":"); if(algorithm!=="scrypt"||!salt||!hash)return false;
    const actual=scryptSync(password,salt,64); const expected=Buffer.from(hash,"hex");
    return actual.length===expected.length && timingSafeEqual(actual,expected);
  } catch { return false; }
}
export function createSessionToken(session: AdminSession) {
  const payload=Buffer.from(JSON.stringify({ ...session, exp: Date.now()+SESSION_DURATION })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function verifySessionToken(token: string | undefined): AdminSession | null {
  if(!token)return null;
  const [payload,signature]=token.split("."); if(!payload||!signature)return null;
  const expected=sign(payload), a=Buffer.from(signature), b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b))return null;
  try { const data=JSON.parse(Buffer.from(payload,"base64url").toString()) as AdminSession & {exp:number};
    if(!data.exp||data.exp<Date.now()||!data.id||!["owner","admin"].includes(data.role))return null;
    return {id:data.id,role:data.role,username:data.username,name:data.name};
  } catch { return null; }
}
export async function getAdminSession(): Promise<AdminSession|null> {
  const cookieStore=await cookies();
  const session=verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if(!session) return null;
  if(session.role==="owner") return session;
  try {
    const sql=await getAdminDb();
    const rows=await sql`SELECT id, username, display_name FROM public.admin_users WHERE id=${session.id} LIMIT 1`;
    if(!rows[0]) return null;
    return {id:String(rows[0].id),role:"admin",username:String(rows[0].username),name:String(rows[0].display_name)};
  } catch { return null; }
}
export async function isAdmin() { return Boolean(await getAdminSession()); }
export async function isOwner() { return (await getAdminSession())?.role==="owner"; }
export async function getAdminDb() { const url=process.env.DATABASE_URL; if(!url)throw new Error("DATABASE_URL não configurada."); return neon(url); }
export const ADMIN_COOKIE=COOKIE_NAME;
