import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getAdminDb, hashAdminPassword } from "@/lib/admin-auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const body=await request.json(),token=String(body.token??""),password=String(body.password??"");
  if(!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Convite inválido."},{status:400});
  if(password.length<10)return NextResponse.json({error:"A senha deve ter pelo menos 10 caracteres."},{status:400});
  const sql=await getAdminDb(),hash=createHash("sha256").update(token).digest("hex");
  const invites=await sql`SELECT email,display_name FROM public.admin_invites WHERE token_hash=${hash} AND expires_at>NOW() LIMIT 1`,invite=invites[0];
  if(!invite)return NextResponse.json({error:"Convite expirado ou já utilizado. Peça outro."},{status:410});
  await sql`INSERT INTO public.admin_users(username,display_name,password_hash) VALUES(${String(invite.email).toLowerCase()},${String(invite.display_name)},${hashAdminPassword(password)})`;
  await sql`DELETE FROM public.admin_invites WHERE token_hash=${hash}`;
  return NextResponse.json({success:true},{status:201});
 }catch(e){const msg=String(e);if(msg.includes("unique")||msg.includes("duplicate"))return NextResponse.json({error:"Esse e-mail já possui conta."},{status:409});console.error(e);return NextResponse.json({error:"Não foi possível ativar conta."},{status:500});}
}