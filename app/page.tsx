import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { ChefHat, Search, Play, Clock3, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

type Recipe = {
  id: string; slug: string; title: string; description: string | null; category: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; difficulty: string;
  servings: number; image_url: string | null;
};

async function getRecipes(): Promise<Recipe[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return [];
  try {
    const sql = neon(connectionString);
    return await sql`
      SELECT r.id, r.slug, r.title, r.description, c.name AS category,
        r.prep_time_minutes, r.cook_time_minutes, r.difficulty, r.servings, r.image_url
      FROM public.recipes r LEFT JOIN public.recipe_categories c ON c.id = r.category_id
      WHERE r.published = true ORDER BY r.created_at DESC
    ` as Recipe[];
  } catch (error) { console.error("Não foi possível carregar receitas:", error); return []; }
}

function RecipeRow({ title, recipes }: { title: string; recipes: Recipe[] }) {
  if (!recipes.length) return null;
  return <section className="mb-12">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold md:text-2xl">{title}</h2><span className="text-xs text-zinc-500">{recipes.length} receita(s)</span></div>
    <div className="flex gap-4 overflow-x-auto pb-4">
      {recipes.map((r,i)=>{const mins=(r.prep_time_minutes||0)+(r.cook_time_minutes||0);return <Link key={r.id} href={`/receita/${r.slug}`} className="group w-[230px] shrink-0 sm:w-[270px]">
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 transition duration-300 group-hover:scale-[1.03] group-hover:ring-2 group-hover:ring-red-500">
          {r.image_url ? <img src={r.image_url} alt={r.title} className="aspect-video w-full object-cover"/> : <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-red-950 to-zinc-900 text-5xl">🍽️</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>
          <div className="absolute bottom-3 left-3 right-3"><p className="line-clamp-2 font-bold">{r.title}</p><div className="mt-1 flex items-center gap-2 text-xs text-zinc-300">{mins>0&&<span className="flex items-center gap-1"><Clock3 size={12}/>{mins} min</span>}<span>{r.difficulty||"Receita"}</span></div></div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{r.description||"Veja os ingredientes e o modo de preparo."}</p>
      </Link>})}
    </div>
  </section>;
}

export default async function Home() {
  const recipes = await getRecipes();
  const featured = recipes[0];
  const groups = Array.from(new Set(recipes.map(r=>r.category||"Mais receitas"))).map(category=>({category,items:recipes.filter(r=>(r.category||"Mais receitas")===category)}));
  return <main className="min-h-screen overflow-hidden bg-[#090909] text-white">
    <header className="fixed z-20 w-full border-b border-white/5 bg-black/75 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
      <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="rounded bg-red-600 p-2"><ChefHat size={20}/></span>RECEI<span className="text-red-500">TARIA</span></Link>
      <nav className="flex items-center gap-4 text-sm text-zinc-300"><a href="#catalogo" className="hover:text-white">Receitas</a><a href="#categorias" className="hover:text-white">Categorias</a><Search size={18}/></nav>
    </div></header>
    {featured ? <section className="relative flex min-h-[570px] items-end pt-24 md:min-h-[700px]">
      {featured.image_url ? <img src={featured.image_url} alt={featured.title} className="absolute inset-0 h-full w-full object-cover object-center"/> : <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-zinc-900 to-black"/>}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-black/20"/>
      <div className="relative z-10 max-w-2xl px-5 pb-16 md:px-12 md:pb-24"><span className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">Receitaria apresenta</span>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{featured.title}</h1><p className="mt-4 line-clamp-3 max-w-xl text-base leading-7 text-zinc-200 md:text-lg">{featured.description||"Descubra uma receita deliciosa, com ingredientes e preparo explicados passo a passo."}</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href={`/receita/${featured.slug}`} className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-bold text-black hover:bg-zinc-200"><Play size={18} fill="currentColor"/> Ver receita</Link><a href="#catalogo" className="inline-flex items-center gap-2 rounded-md bg-zinc-700/80 px-6 py-3 font-bold hover:bg-zinc-600"><ChevronRight size={18}/> Explorar catálogo</a></div>
      </div>
    </section> : <section className="flex min-h-[450px] items-end bg-gradient-to-br from-red-950 via-zinc-900 to-black px-5 pb-16 pt-32 md:px-12"><div><p className="font-bold uppercase tracking-widest text-red-400">Receitaria</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Sua próxima receita favorita.</h1><p className="mt-4 text-zinc-300">Receitas simples, organizadas para você descobrir.</p></div></section>}
    <section id="catalogo" className="relative z-10 mx-auto max-w-7xl px-5 py-8 md:px-8">
      {recipes.length===0 ? <div className="rounded-xl border border-white/10 bg-zinc-900 p-8 text-center"><ChefHat className="mx-auto text-red-500" size={36}/><h2 className="mt-4 text-xl font-bold">Ainda não há receitas publicadas</h2><p className="mt-2 text-sm text-zinc-400">Quando você cadastrar receitas no painel, elas aparecerão aqui.</p></div> : <><RecipeRow title="Em destaque" recipes={recipes.slice(0,8)}/>{groups.map(g=><RecipeRow key={g.category} title={g.category} recipes={g.items}/>)}</>}
    </section>
    <section id="categorias" className="mx-auto max-w-7xl px-5 pb-12 md:px-8"><h2 className="mb-4 text-xl font-bold">Explore por categoria</h2><div className="flex flex-wrap gap-2">{groups.map(g=><a key={g.category} href="#catalogo" className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:border-red-500 hover:bg-red-500/10">{g.category}</a>)}</div></section>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-500">© {new Date().getFullYear()} Receitaria. Descubra, prepare e aproveite.</footer>
  </main>;
}