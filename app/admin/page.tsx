"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, LogOut, Plus, Trash2, Eye, EyeOff, LoaderCircle, Users } from "lucide-react";

type Category = { id: string; name: string; slug: string };
type Recipe = { id: string; title: string; description: string | null; category: string | null; published: boolean; created_at: string };
type AdminUser = { id: string; username: string; display_name: string; created_at: string };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "">("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdmins, setShowAdmins] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category_id: "", prep_time_minutes: "10", cook_time_minutes: "20",
    servings: "2", difficulty: "fácil", image_url: "", ingredientsText: "", stepsText: "", published: true,
  });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/recipes");
      if (response.status === 401) { setLoggedIn(false); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar.");
      setRecipes(data.recipes || []);
      setCategories(data.categories || []);
      setLoggedIn(true);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Erro inesperado."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senha inválida.");
      setLoggedIn(true); setRole(data.role || "admin"); setPassword(""); setUsername(""); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false); setRecipes([]); setRole(""); setMessage("Sessão encerrada.");
  }

  async function saveRecipe(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const ingredients = form.ingredientsText.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
      const separator = line.indexOf(" - ");
      return separator >= 0 ? { quantity: line.slice(0, separator).trim(), name: line.slice(separator + 3).trim() } : { quantity: "", name: line };
    });
    const steps = form.stepsText.split("\n").map(line => line.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/admin/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: form.title, description: form.description, category_id: form.category_id,
        prep_time_minutes: form.prep_time_minutes, cook_time_minutes: form.cook_time_minutes,
        servings: form.servings, difficulty: form.difficulty, image_url: form.image_url,
        ingredients, steps, published: form.published,
      })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar.");
      setMessage("Receita cadastrada com sucesso!");
      setForm({ title: "", description: "", category_id: "", prep_time_minutes: "10", cook_time_minutes: "20", servings: "2", difficulty: "fácil", image_url: "", ingredientsText: "", stepsText: "", published: true });
      setShowForm(false); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Erro ao cadastrar receita."); }
    finally { setBusy(false); }
  }

  async function togglePublish(recipe: Recipe) {
    const res = await fetch("/api/admin/recipes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: recipe.id, published: !recipe.published }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Falha ao alterar publicação."); return; }
    await load();
  }

  async function removeRecipe(recipe: Recipe) {
    if (!window.confirm(`Excluir definitivamente "${recipe.title}"?`)) return;
    const res = await fetch("/api/admin/recipes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: recipe.id }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Falha ao excluir."); return; }
    setMessage("Receita excluída."); await load();
  }

  const inputClass = "w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500";
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-300"><LoaderCircle className="mr-2 animate-spin"/> Carregando painel…</main>;

  if (!loggedIn) return <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-white">
    <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8">
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-red-600 p-3"><ChefHat/></span><div><h1 className="text-2xl font-bold">Painel administrativo</h1><p className="text-sm text-zinc-400">Receitaria</p></div></div>
      <label className="mb-2 block text-sm text-zinc-300">Usuário (deixe vazio para usar a senha principal)</label><input className={inputClass+" mb-4"} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="nome de usuário"/><label className="mb-2 block text-sm text-zinc-300">Senha de administrador</label>
      <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/>
      {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
      <button disabled={busy} className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 disabled:opacity-60">{busy ? "Entrando…" : "Entrar"}</button>
      <Link href="/" className="mt-4 block text-center text-sm text-zinc-400 hover:text-white">Voltar ao site</Link>
    </form>
  </main>;

  return <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white md:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-red-600 p-3"><ChefHat/></span><div><h1 className="text-2xl font-bold">Painel Receitaria</h1><p className="text-sm text-zinc-400">Gerencie as receitas do seu site</p></div></div>
        <div className="flex gap-2"><Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Ver site</Link><button onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"><LogOut size={16}/> Sair</button></div>
      </header>
      {message && <div className="mb-5 rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm">{message}</div>}
      {role === "owner" && <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-lg font-bold"><Users size={18}/> Administradores</h2><p className="text-sm text-zinc-400">Somente sua conta principal pode gerenciar usuários.</p></div>
          <button onClick={async()=>{setShowAdmins(!showAdmins); if(!showAdmins){const res=await fetch("/api/admin/users");const data=await res.json();if(res.ok)setAdminUsers(data.users||[]);else setMessage(data.error||"Erro ao carregar contas.");}}} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">{showAdmins?"Fechar":"Gerenciar administradores"}</button>
        </div>
        {showAdmins && <div className="mt-5 space-y-4">
          <form className="grid gap-3 md:grid-cols-4" onSubmit={async(e)=>{e.preventDefault();setBusy(true);setMessage("");try{const res=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:adminName,username:adminUsername,password:adminPassword})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Falha ao criar.");setMessage("Administrador criado.");setAdminName("");setAdminUsername("");setAdminPassword("");const list=await fetch("/api/admin/users");setAdminUsers((await list.json()).users||[]);}catch(err){setMessage(err instanceof Error?err.message:"Erro ao criar conta.");}finally{setBusy(false);}}}>
            <input className={inputClass} placeholder="Nome" value={adminName} onChange={e=>setAdminName(e.target.value)} required/>
            <input className={inputClass} placeholder="Usuário (ex.: maria)" value={adminUsername} onChange={e=>setAdminUsername(e.target.value)} required/>
            <input className={inputClass} type="password" minLength={10} placeholder="Senha (mín. 10 caracteres)" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} required/>
            <button disabled={busy} className="rounded-xl bg-red-600 px-4 py-3 font-semibold disabled:opacity-60">{busy?"Criando…":"Adicionar administrador"}</button>
          </form>
          <div className="divide-y divide-white/10 rounded-xl border border-white/10">
            {adminUsers.length===0?<p className="p-4 text-sm text-zinc-400">Nenhum administrador adicional cadastrado.</p>:adminUsers.map(user=><div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{user.display_name}</p><p className="text-sm text-zinc-400">@{user.username}</p></div><button onClick={async()=>{if(!window.confirm("Remover o acesso de "+user.display_name+"?"))return;const res=await fetch("/api/admin/users",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:user.id})});const data=await res.json();if(!res.ok){setMessage(data.error||"Falha ao remover.");return;}setAdminUsers(adminUsers.filter(x=>x.id!==user.id));setMessage("Administrador removido.");}} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400">Remover</button></div>)}
          </div>
          <p className="text-xs text-zinc-500">Os administradores adicionais podem gerenciar receitas, mas não podem gerenciar contas.</p>
        </div>}
      </section>}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div><p className="text-sm text-zinc-400">Total cadastradas</p><p className="text-3xl font-bold">{recipes.length}</p><p className="text-xs text-zinc-500">{recipes.filter(r => r.published).length} publicadas · {recipes.filter(r => !r.published).length} rascunhos</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"><Plus size={18}/>{showForm ? "Fechar formulário" : "Adicionar receita"}</button>
      </section>

      {showForm && <form onSubmit={saveRecipe} className="mb-8 space-y-5 rounded-2xl border border-white/10 bg-zinc-900 p-5 md:p-7">
        <h2 className="text-xl font-bold">Cadastrar nova receita</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">Nome da receita *<input className={inputClass+" mt-2"} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label>
          <label className="text-sm">Categoria<select className={inputClass+" mt-2"} value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Sem categoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </div>
        <label className="block text-sm">Descrição<textarea className={inputClass+" mt-2"} rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label className="block text-sm">URL da imagem (opcional)<input className={inputClass+" mt-2"} type="url" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <label className="text-sm">Preparo (min)<input className={inputClass+" mt-2"} type="number" min="0" value={form.prep_time_minutes} onChange={e=>setForm({...form,prep_time_minutes:e.target.value})}/></label>
          <label className="text-sm">Cozimento (min)<input className={inputClass+" mt-2"} type="number" min="0" value={form.cook_time_minutes} onChange={e=>setForm({...form,cook_time_minutes:e.target.value})}/></label>
          <label className="text-sm">Porções<input className={inputClass+" mt-2"} type="number" min="1" value={form.servings} onChange={e=>setForm({...form,servings:e.target.value})}/></label>
          <label className="text-sm">Dificuldade<select className={inputClass+" mt-2"} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}><option>fácil</option><option>médio</option><option>difícil</option></select></label>
        </div>
        <label className="block text-sm">Ingredientes (uma linha por ingrediente; use &quot;quantidade - ingrediente&quot;)<textarea className={inputClass+" mt-2"} rows={5} placeholder={"2 unidades - ovos\n1 xícara - farinha"} value={form.ingredientsText} onChange={e=>setForm({...form,ingredientsText:e.target.value})}/></label>
        <label className="block text-sm">Modo de preparo (uma etapa por linha)<textarea className={inputClass+" mt-2"} rows={6} placeholder={"Quebre os ovos em uma tigela.\nMisture os ingredientes.\nLeve ao fogo."} value={form.stepsText} onChange={e=>setForm({...form,stepsText:e.target.value})}/></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Publicar imediatamente no site</label>
        <button disabled={busy} className="rounded-xl bg-red-600 px-6 py-3 font-semibold hover:bg-red-700 disabled:opacity-60">{busy ? "Salvando…" : "Salvar receita"}</button>
      </form>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <div className="border-b border-white/10 p-5"><h2 className="text-lg font-bold">Receitas cadastradas</h2></div>
        {recipes.length === 0 ? <p className="p-8 text-center text-zinc-400">Nenhuma receita cadastrada ainda.</p> : <div className="divide-y divide-white/10">
          {recipes.map(recipe=><div key={recipe.id} className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5">
            <div className="min-w-0"><h3 className="font-semibold">{recipe.title}</h3><p className="mt-1 text-sm text-zinc-400">{recipe.category || "Sem categoria"} · <span className={recipe.published ? "text-green-400" : "text-amber-400"}>{recipe.published ? "Publicado" : "Rascunho"}</span></p></div>
            <div className="flex gap-2"><button onClick={()=>togglePublish(recipe)} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">{recipe.published ? <EyeOff size={16}/> : <Eye size={16}/>} {recipe.published ? "Despublicar" : "Publicar"}</button><button onClick={()=>removeRecipe(recipe)} className="rounded-lg border border-red-500/30 px-3 py-2 text-red-400 hover:bg-red-500/10"><Trash2 size={16}/></button></div>
          </div>)}
        </div>}
      </section>
      <p className="mt-6 text-center text-xs text-zinc-600">Painel protegido por sessão administrativa. Não compartilhe sua senha.</p>
    </div>
  </main>;
}
