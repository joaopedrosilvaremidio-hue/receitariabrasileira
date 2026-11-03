import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { ChefHat, ArrowLeft, Clock3, Utensils, ListChecks } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Ingredient = { ingredient_name: string; quantity: string | null };
type Recipe = {
  id: string; title: string; description: string | null; category: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null;
  difficulty: string | null; image_url: string | null;
};

export default async function RecipeDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) notFound();
  const sql = neon(connectionString);
  const rows = await sql`
    SELECT r.id, r.title, r.description, c.name AS category, r.prep_time_minutes,
      r.cook_time_minutes, r.difficulty, r.image_url
    FROM public.recipes r LEFT JOIN public.recipe_categories c ON c.id = r.category_id
    WHERE r.slug = ${slug} AND r.published = true LIMIT 1
  `;
  if (!rows.length) notFound();
  const recipe = rows[0] as Recipe;
  const ingredients = await sql`
    SELECT ingredient_name, quantity FROM public.recipe_ingredients
    WHERE recipe_id = ${recipe.id} ORDER BY sort_order
  ` as Ingredient[];
  const steps = await sql`
    SELECT instruction FROM public.recipe_steps WHERE recipe_id = ${recipe.id} ORDER BY sort_order
  ` as { instruction: string }[];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return <main className="min-h-screen bg-[#0a0a0a] text-white">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="rounded-lg bg-red-600 p-2"><ChefHat size={20}/></span>Recei<span className="text-red-500">taria</span></Link>
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"><ArrowLeft size={16}/> Voltar às receitas</Link>
    </div></header>
    <article className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-6 text-sm text-red-400">{recipe.category || "Receita"}</div>
      <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">{recipe.title}</h1>
      {recipe.description && <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">{recipe.description}</p>}
      <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-300">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-2"><Clock3 size={16} className="text-red-400"/>{totalTime ? totalTime+" min" : "Tempo não informado"}</span>
        {recipe.difficulty && <span className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">Nível: {recipe.difficulty}</span>}
      </div>
      {recipe.image_url ? <img src={recipe.image_url} alt={recipe.title} className="mt-8 max-h-[460px] w-full rounded-2xl object-cover"/> : <div className="mt-8 flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-red-950 via-zinc-900 to-black text-7xl">🍲</div>}
      <div className="mt-8 grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <section className="h-fit rounded-2xl border border-white/10 bg-zinc-900 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Utensils className="text-red-500"/> Ingredientes</h2>
          <p className="mt-1 text-sm text-zinc-500">Separe tudo antes de começar.</p>
          {ingredients.length ? <ul className="mt-5 space-y-3">{ingredients.map((item,i)=><li key={i} className="flex gap-3 border-b border-white/10 pb-3 text-zinc-200"><span className="mt-1 h-4 w-4 shrink-0 rounded border border-red-500/60"/><span>{item.quantity ? item.quantity+" — " : ""}{item.ingredient_name}</span></li>)}</ul> : <p className="mt-4 text-sm text-zinc-400">Ingredientes ainda não cadastrados.</p>}
        </section>
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold"><ListChecks className="text-red-500"/> Modo de preparo</h2>
          {steps.length ? <ol className="mt-5 space-y-5">{steps.map((step,i)=><li key={i} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold">{i+1}</span><p className="pt-1 leading-7 text-zinc-300">{step.instruction}</p></li>)}</ol> : <p className="mt-4 text-sm text-zinc-400">Modo de preparo ainda não cadastrado.</p>}
        </section>
      </div>
      <div className="mt-8"><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"><ArrowLeft size={17}/> Explorar outras receitas</Link></div>
    </article>
    <footer className="mt-10 border-t border-white/10 px-4 py-8 text-center text-sm text-zinc-500">Receitaria · Receitas explicadas com simplicidade</footer>
  </main>;
}
