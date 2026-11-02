import Link from "next/link";
import { ChefHat, Search, Heart, Clock3, ArrowRight } from "lucide-react";

const categories = ["Café da manhã", "Almoço", "Jantar", "Sobremesas"];

const recipes = [
  { name: "Omelete simples", category: "Café da manhã", time: "10 min", difficulty: "Fácil", emoji: "🍳" },
  { name: "Arroz soltinho", category: "Acompanhamentos", time: "25 min", difficulty: "Fácil", emoji: "🍚" },
  { name: "Macarrão cremoso", category: "Almoço", time: "20 min", difficulty: "Fácil", emoji: "🍝" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="rounded-lg bg-red-600 p-2"><ChefHat size={20} /></span>
            Recei<span className="text-red-500">taria</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-zinc-300">
            <a href="#receitas" className="hover:text-white">Receitas</a>
            <a href="#categorias" className="hover:text-white">Categorias</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="mb-5 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">Cozinhar pode ser simples</span>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">Aprenda a cozinhar com <span className="text-red-500">confiança.</span></h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">Receitas explicadas passo a passo, feitas para quem está começando na cozinha.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#receitas" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-700">Explorar receitas <ArrowRight size={18}/></a>
            <a href="#categorias" className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">Ver categorias</a>
          </div>
        </div>
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 md:p-10">
          <div className="absolute right-6 top-6 rounded-full bg-red-600/15 p-3 text-red-400"><ChefHat size={24}/></div>
          <div className="mb-4 text-sm font-medium text-zinc-400">SUA PRÓXIMA RECEITA</div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-red-950 via-zinc-900 to-zinc-800 text-8xl">🍝</div>
          <div className="mt-5 flex items-center justify-between">
            <div><h2 className="text-xl font-bold">Macarrão fácil</h2><p className="mt-1 text-sm text-zinc-400">Uma receita para começar bem.</p></div>
            <span className="flex items-center gap-1 text-sm text-zinc-400"><Clock3 size={16}/> 20 min</span>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl px-5 py-10">
        <div><p className="text-sm font-semibold text-red-500">EXPLORE</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">O que você quer preparar?</h2></div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((category) => <a key={category} href="#receitas" className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-5 text-left font-semibold transition hover:border-red-500/50 hover:bg-zinc-800">{category}<span className="mt-2 block text-sm font-normal text-zinc-500">Ver receitas →</span></a>)}
        </div>
      </section>

      <section id="receitas" className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex items-end justify-between"><div><p className="text-sm font-semibold text-red-500">PARA INICIANTES</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Receitas para começar</h2></div><Search className="text-zinc-500"/></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => <article key={recipe.name} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-6xl">{recipe.emoji}</div>
            <div className="p-5"><div className="flex items-center justify-between text-xs text-zinc-500"><span>{recipe.category}</span><span>{recipe.time}</span></div><h3 className="mt-2 text-lg font-bold">{recipe.name}</h3><p className="mt-1 text-sm text-zinc-400">Passo a passo simples para iniciantes.</p><div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-400">{recipe.difficulty}</span><Heart size={18} className="text-zinc-500"/></div></div>
          </article>)}
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">Receitas organizadas para facilitar seu dia a dia na cozinha.</p>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-500">© {new Date().getFullYear()} Receitaria. Cozinhar pode ser simples.</footer>
    </main>
  );
}
