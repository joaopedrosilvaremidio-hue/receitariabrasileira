import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { ChefHat, Clock3 } from "lucide-react";

export const dynamic = "force-dynamic";

type Recipe = {
  id: string; slug: string; title: string; description: string | null; category: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; difficulty: string; image_url: string | null;
};

async function getRecipes(): Promise<Recipe[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return [];
  try {
    const sql = neon(connectionString);
    return await sql`
      SELECT r.id, r.slug, r.title, r.description, c.name AS category,
        r.prep_time_minutes, r.cook_time_minutes, r.difficulty, r.image_url
      FROM public.recipes r LEFT JOIN public.recipe_categories c ON c.id = r.category_id
      WHERE r.published = true ORDER BY r.created_at DESC
    ` as Recipe[];
  } catch (error) { console.error("Erro ao carregar receitas:", error); return []; }
}

export default async function Home() {
  const recipes = await getRecipes();
  const groups = Array.from(new Set(recipes.map(r=>r.category||"Receitas"))).map(category=>({category,items:recipes.filter(r=>(r.category||"Receitas")===category)}));
  return <main className="min-h-screen bg-[#090909] text-white">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
      <Link href="/" className="flex items-center gap-2 text-xl font-black"><span className="rounded bg-red-600 p-2"><ChefHat size={20}/></span>RECEI<span className="text-red-500">TARIA</span></Link>
      <a href="#receitas" className="text-sm text-zinc-300 hover:text-white">Ver receitas</a>
    </div></header>
    <section className="mx-auto max-w-7xl px-5 py-10 md:py-14"><h1 className="text-3xl font-black md:text-5xl">O que vamos cozinhar?</h1><p className="mt-3 text-zinc-400">Escolha uma receita e siga o passo a passo.</p></section>
    <section id="receitas" className="mx-auto max-w-7xl px-5 pb-12">
      {recipes.length===0 ? <div className="rounded-xl border border-white/10 bg-zinc-900 p-8 text-center"><ChefHat className="mx-auto text-red-500" size={36}/><h2 className="mt-4 text-xl font-bold">Nenhuma receita publicada</h2><p className="mt-2 text-sm text-zinc-400">As receitas aparecerão aqui assim que forem cadastradas.</p></div> : groups.map(g=><section key={g.category} className="mb-10">
        <h2 className="mb-4 text-xl font-bold md:text-2xl">{g.category}</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {g.items.map(r=>{const mins=(r.prep_time_minutes||0)+(r.cook_time_minutes||0);return <Link key={r.id} href={`/receita/${r.slug}`} className="group overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition hover:-translate-y-1 hover:border-red-500/50">
            {r.image_url?<img src={r.image_url} alt={r.title} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.03]"/>:<div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-red-950 to-zinc-900 text-4xl">🍲</div>}
            <div className="p-3"><h3 className="line-clamp-2 font-semibold">{r.title}</h3>{mins>0&&<p className="mt-2 flex items-center gap-1 text-xs text-zinc-400"><Clock3 size={13}/>{mins} minutos</p>}</div>
          </Link>})}
        </div>
      </section>)}
    </section>
    <footer className="border-t border-white/10 px-5 py-5 text-center text-xs text-zinc-500">© {new Date().getFullYear()} Receitaria</footer>
  </main>;
}