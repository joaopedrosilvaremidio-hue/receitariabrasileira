import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { getAdminSession, getAdminDb } from "@/lib/admin-auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request){
 const session=await getAdminSession(); if(session?.role!=="owner")return NextResponse.json({error:"Apenas o administrador principal pode convidar contas."},{status:403});
 try{
  const body=await request.json(); const email=String(body.email??"").trim().toLowerCase(); const name=String(body.name??"").trim();
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:"Informe um e-mail válido."},{status:400});
  if(name.length<2||name.length>80)return NextResponse.json({error:"Informe um nome de 2 a 80 caracteres."},{status:400});
  const key=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
  if(!key||!from)return NextResponse.json({error:"Configure RESEND_API_KEY e RESEND_FROM_EMAIL na Vercel."},{status:503});
  const sql=await getAdminDb(); const found=await sql`SELECT id FROM public.admin_users WHERE username=${email} LIMIT 1`;
  if(found.length)return NextResponse.json({error:"Esse e-mail já tem conta. Use cadastro direto."},{status:409});
  await sql`CREATE TABLE IF NOT EXISTS public.admin_invites (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,token_hash TEXT NOT NULL,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  const token=randomBytes(32).toString("hex"),hash=createHash("sha256").update(token).digest("hex");
  await sql`INSERT INTO public.admin_invites(email,display_name,token_hash,expires_at) VALUES(${email},${name},${hash},NOW()+INTERVAL '48 hours') ON CONFLICT(email) DO UPDATE SET display_name=EXCLUDED.display_name,token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,created_at=NOW()`;
  const link=new URL("/admin/convite",request.url).origin+"/admin/convite?token="+token;
  const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[email],subject:"Convite para administrar a Receitaria",html:`<p>Olá, ${name.replace(/[&<>"]/g,"")}. Você foi convidado(a) para administrar a Receitaria.</p><p><a href="${link}">Aceitar convite e criar senha</a></p><p>O convite expira em 48 horas.</p>`})});
  if(!mail.ok){console.error(await mail.text());return NextResponse.json({error:"Falha no envio. Verifique remetente e configuração do Resend."},{status:502});}
  return NextResponse.json({success:true},{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Não foi possível enviar convite."},{status:500});}
}