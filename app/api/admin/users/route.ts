import { NextResponse } from "next/server";
import { getAdminSession, getAdminDb, hashAdminPassword } from "@/lib/admin-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET() {
  const session=await getAdminSession();
  if(session?.role!=="owner") return NextResponse.json({error:"Apenas o administrador principal pode gerenciar contas."},{status:403});
  try {
    const sql=await getAdminDb();
    const users=await sql`SELECT id, username, display_name, created_at FROM public.admin_users ORDER BY created_at DESC`;
    return NextResponse.json({users});
  } catch(error) { console.error(error); return NextResponse.json({error:"Erro ao carregar administradores."},{status:500}); }
}
export async function POST(request:Request) {
  const session=await getAdminSession();
  if(session?.role!=="owner") return NextResponse.json({error:"Apenas o administrador principal pode criar contas."},{status:403});
  try {
    const body=await request.json();
    const username=String(body.username??"").trim().toLowerCase();
    const name=String(body.name??"").trim();
    const password=String(body.password??"");
    if(username.length<3||username.length>80) return NextResponse.json({error:"Informe um usuário de 3 a 80 caracteres."},{status:400});
    if(name.length<2||name.length>80) return NextResponse.json({error:"Informe um nome de 2 a 80 caracteres."},{status:400});
    if(password.length<10) return NextResponse.json({error:"A senha deve ter pelo menos 10 caracteres."},{status:400});
    const sql=await getAdminDb();
    const rows=await sql`INSERT INTO public.admin_users (username,display_name,password_hash) VALUES (${username},${name},${hashAdminPassword(password)}) RETURNING id,username,display_name,created_at`;
    return NextResponse.json({user:rows[0]}, {status:201});
  } catch(error) {
    const msg=String(error);
    if(msg.includes("unique")||msg.includes("duplicate")) return NextResponse.json({error:"Esse usuário já existe."},{status:409});
    console.error(error); return NextResponse.json({error:"Não foi possível criar a conta."},{status:500});
  }
}
export async function DELETE(request:Request) {
  const session=await getAdminSession();
  if(session?.role!=="owner") return NextResponse.json({error:"Apenas o administrador principal pode remover contas."},{status:403});
  try {
    const {id}=await request.json();
    if(!id) return NextResponse.json({error:"Conta não identificada."},{status:400});
    const sql=await getAdminDb();
    const deleted=await sql`DELETE FROM public.admin_users WHERE id=${id} RETURNING id`;
    if(!deleted.length) return NextResponse.json({error:"Administrador não encontrado."},{status:404});
    return NextResponse.json({success:true});
  } catch(error) { console.error(error); return NextResponse.json({error:"Não foi possível remover a conta."},{status:500}); }
}
