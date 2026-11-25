import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, verifyPassword, verifyAdminPassword, getAdminDb } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");
    if (!password) return NextResponse.json({ error: "Informe sua senha." }, { status: 401 });

    let session;
    if (verifyPassword(password)) {
      session = { id: "owner", role: "owner" as const, username: "owner", name: "Administrador principal" };
    } else {
      const sql = await getAdminDb();
      const rows = await sql`SELECT id, username, display_name, password_hash FROM public.admin_users`;
      const matches = rows.filter((user: any) => verifyAdminPassword(password, String(user.password_hash)));
      if (matches.length === 0) {
        return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
      }
      if (matches.length > 1) {
        return NextResponse.json({ error: "Esta senha está em uso por mais de um administrador. Peça ao proprietário uma senha exclusiva." }, { status: 409 });
      }
      const user = matches[0];
      session = { id: String(user.id), role: "admin" as const, username: String(user.username), name: String(user.display_name) };
    }

    const response = NextResponse.json({ success: true, role: session.role, name: session.name });
    response.cookies.set(ADMIN_COOKIE, createSessionToken(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível entrar." }, { status: 400 });
  }
}
