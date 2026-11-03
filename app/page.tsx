import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { ChefHat, Search, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const categories = [
  { label: "Café da manhã", slug: "cafe-da-manha" },
  { label: "Almoço", slug: "almoco" },
  { label: "Jantar", slug: "jantar" },
  { label: "Sobremesas", slug: "sobremesas" },
  { label: "Lanches", slug: "lanches" },
  { label: "Acompanhamentos", slug: "acompanhamentos" },
];

type Recipe = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: string;
  servings: number;
  image_url: string | null;
};

async function getRecipes(): Promise<Recipe[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return [];
  try {
    const sql = neon(connectionString);
    return await sql`
      SELECT r.id, r.slug, r.title, r.description, c.name AS category,
        r.prep_time_minutes, r.cook_time_minutes, r.difficulty, r.servings, r.image_url
      FROM public.recipes r
      LEFT JOIN public.recipe_categories c ON c.id = r.category_id
      WHERE r.published = true
      ORDER BY r.created_at DESC
    ` as Recipe[];
  } catch (error) {
    console.error("Não foi possível carregar receitas do Neon:", error);
    return [];
  }
}

export default async function Home() {
  const recipes = await getRecipes();
  return <main className="min-h-screen bg-[#0a0a0a] text-white">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold"><span className="rounded-lg bg-red-600 p-2"><ChefHat size={20}/></span>Recei<span className="text-red-500">taria</span></Link>
      <nav className="flex gap-5 text-sm text-zinc-300"><a href="#receitas">Receitas</a><a href="#categorias">Categorias</a></nav>
    </div></header>
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
      <div><span className="mb-5 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">Cozinhar pode ser simples</span>
        <h1 className="max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">Aprenda a cozinhar com <span className="text-red-500">confiança.</span></h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">Receitas explicadas passo a passo, feitas para quem está começando na cozinha.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="#receitas" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-700">Explorar receitas <ArrowRight size={18}/></a><a href="#categorias" className="rounded-lg border border-white/15 px-5 py-3 font-semibold">Ver categorias</a></div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 md:p-10"><div className="mb-4 text-sm font-medium text-zinc-400">RECEITAS DA RECEITARIA</div><div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-red-950 via-zinc-900 to-zinc-800 text-8xl">🍲</div><div className="mt-5"><h2 className="text-xl font-bold">Inspire-se na cozinha</h2><p className="mt-1 text-sm text-zinc-400">Receitas práticas para o seu dia a dia.</p></div></div>
    </section>
    <section id="categorias" className="mx-auto max-w-7xl px-5 py-10"><p className="text-sm font-semibold text-red-500">EXPLORE</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">O que você quer preparar?</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{categories.map(c=><a key={c.slug} href="#receitas" className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-5 font-semibold transition hover:border-red-500/50 hover:bg-zinc-800">{c.label}<span className="mt-2 block text-sm font-normal text-zinc-500">Ver receitas →</span></a>)}</div>
    </section>
    <section id="receitas" className="mx-auto max-w-7xl px-5 py-14"><div className="flex items-end justify-between"><div><p className="text-sm font-semibold text-red-500">RECEITAS CADASTRADAS</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Receitas para preparar</h2></div><Search className="text-zinc-500"/></div>
      {recipes.length===0 ? <div className="mt-7 rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center"><ChefHat className="mx-auto text-red-500" size={36}/><h3 className="mt-4 text-lg font-bold">Ainda não há receitas publicadas</h3><p className="mt-2 text-sm text-zinc-400">As receitas aparecerão aqui quando forem cadastradas.</p></div> :
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recipes.map(r=>{const total=(r.prep_time_minutes??0)+(r.cook_time_minutes??0);return <Link href={`/receita/${r.slug}`} key={r.id} className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-950/20">
        {r.image_url ? <img src={r.image_url} alt={r.title} className="aspect-[16/9] w-full object-cover"/> : <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-red-950 via-zinc-900 to-zinc-950 text-6xl">🍽️</div>}
        <div className="p-5"><div className="flex items-center justify-between text-xs text-zinc-500"><span>{r.category||"Receita"}</span>{total>0&&<span>{total} min</span>}</div><h3 className="mt-2 text-lg font-bold">{r.title}</h3><p className="mt-1 text-sm text-zinc-400">{r.description||"Confira os ingredientes e o modo de preparo."}</p><div className="mt-4 flex items-center justify-between text-sm text-zinc-400"><span>{r.difficulty}</span><span>{r.servings} porção(ões)</span></div></div>
      </article>})}</div>}
    </section>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-500">© {new Date().getFullYear()} Receitaria. Cozinhar pode ser simples.</footer>
  </main>;
}
