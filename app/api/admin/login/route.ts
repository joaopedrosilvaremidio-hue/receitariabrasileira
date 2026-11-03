import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, verifyPassword, verifyAdminPassword, getAdminDb } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body=await request.json();
    const username=String(body.username??"").trim().toLowerCase();
    const password=String(body.password??"");
    let session;
    if(!username && verifyPassword(password)) {
      session={id:"owner",role:"owner" as const,username:"owner",name:"Administrador principal"};
    } else if(username && password) {
      const sql=await getAdminDb();
      const rows=await sql`SELECT id, username, display_name, password_hash FROM public.admin_users WHERE username=${username} LIMIT 1`;
      const user=rows[0];
      if(!user || !verifyAdminPassword(password,String(user.password_hash))) return NextResponse.json({error:"Usuário ou senha incorretos."},{status:401});
      session={id:String(user.id),role:"admin" as const,username:String(user.username),name:String(user.display_name)};
    } else return NextResponse.json({error:"Informe usuário e senha, ou somente a senha principal."},{status:401});
    const response=NextResponse.json({success:true,role:session.role,name:session.name});
    response.cookies.set(ADMIN_COOKIE,createSessionToken(session),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:7*24*60*60});
    return response;
  } catch(error) { console.error(error); return NextResponse.json({error:"Não foi possível entrar."},{status:400}); }
}
