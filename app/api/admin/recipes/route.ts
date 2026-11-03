import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAdmin, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return neon(url);
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = db();
    const recipes = await sql`
      SELECT r.id, r.title, r.slug, r.description, r.category_id, c.name AS category,
        r.prep_time_minutes, r.cook_time_minutes, r.servings, r.difficulty, r.image_url,
        r.published, r.created_at,
        COALESCE((SELECT json_agg(json_build_object('name', i.ingredient_name, 'quantity', i.quantity) ORDER BY i.sort_order)
          FROM public.recipe_ingredients i WHERE i.recipe_id = r.id), '[]'::json) AS ingredients,
        COALESCE((SELECT json_agg(s.instruction ORDER BY s.sort_order)
          FROM public.recipe_steps s WHERE s.recipe_id = r.id), '[]'::json) AS steps
      FROM public.recipes r LEFT JOIN public.recipe_categories c ON c.id = r.category_id
      ORDER BY r.created_at DESC
    `;
    const categories = await sql`SELECT id, name, slug FROM public.recipe_categories ORDER BY name`;
    const session = await getAdminSession();
    return NextResponse.json({ recipes, categories, role: session?.role || "admin" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao consultar receitas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Informe o título da receita." }, { status: 400 });
    const slug = (String(body.slug || title).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7));
    const prep = body.prep_time_minutes === "" || body.prep_time_minutes == null ? null : Number(body.prep_time_minutes);
    const cook = body.cook_time_minutes === "" || body.cook_time_minutes == null ? null : Number(body.cook_time_minutes);
    const servings = Math.max(1, Number(body.servings) || 1);
    const sql = db();
    const inserted = await sql`
      INSERT INTO public.recipes (title, slug, description, category_id, prep_time_minutes, cook_time_minutes, servings, difficulty, image_url, published)
      VALUES (${title}, ${slug}, ${String(body.description ?? "").trim() || null}, ${body.category_id || null},
        ${prep}, ${cook}, ${servings}, ${body.difficulty || "fácil"}, ${String(body.image_url ?? "").trim() || null}, ${Boolean(body.published)})
      RETURNING id
    `;
    const recipeId = inserted[0].id;
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i];
      if (String(item.name ?? "").trim()) {
        await sql`INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, sort_order)
          VALUES (${recipeId}, ${String(item.name).trim()}, ${String(item.quantity ?? "").trim() || null}, ${i})`;
      }
    }
    const steps = Array.isArray(body.steps) ? body.steps : [];
    for (let i = 0; i < steps.length; i++) {
      if (String(steps[i]).trim()) await sql`INSERT INTO public.recipe_steps (recipe_id, instruction, sort_order) VALUES (${recipeId}, ${String(steps[i]).trim()}, ${i})`;
    }
    return NextResponse.json({ success: true, id: recipeId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao salvar a receita. Confira os campos." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "ID da receita ausente." }, { status: 400 });
    const sql = db();

    // Mantém a ação rápida de publicar/despublicar.
    if (typeof body.published === "boolean" && !("title" in body)) {
      await sql`UPDATE public.recipes SET published = ${body.published}, updated_at = now() WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Informe o título da receita." }, { status: 400 });
    const prep = body.prep_time_minutes === "" || body.prep_time_minutes == null ? null : Number(body.prep_time_minutes);
    const cook = body.cook_time_minutes === "" || body.cook_time_minutes == null ? null : Number(body.cook_time_minutes);
    const servings = Math.max(1, Number(body.servings) || 1);
    await sql`UPDATE public.recipes SET title = ${title}, description = ${String(body.description ?? "").trim() || null},
      category_id = ${body.category_id || null}, prep_time_minutes = ${prep}, cook_time_minutes = ${cook},
      servings = ${servings}, difficulty = ${body.difficulty || "fácil"}, image_url = ${String(body.image_url ?? "").trim() || null},
      published = ${Boolean(body.published)}, updated_at = now() WHERE id = ${id}`;

    await sql`DELETE FROM public.recipe_ingredients WHERE recipe_id = ${id}`;
    await sql`DELETE FROM public.recipe_steps WHERE recipe_id = ${id}`;
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i];
      if (String(item.name ?? "").trim()) {
        await sql`INSERT INTO public.recipe_ingredients (recipe_id, ingredient_name, quantity, sort_order)
          VALUES (${id}, ${String(item.name).trim()}, ${String(item.quantity ?? "").trim() || null}, ${i})`;
      }
    }
    const steps = Array.isArray(body.steps) ? body.steps : [];
    for (let i = 0; i < steps.length; i++) {
      if (String(steps[i]).trim()) await sql`INSERT INTO public.recipe_steps (recipe_id, instruction, sort_order) VALUES (${id}, ${String(steps[i]).trim()}, ${i})`;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível atualizar a receita." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID da receita ausente." }, { status: 400 });
    const sql = db();
    await sql`DELETE FROM public.recipes WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível excluir a receita." }, { status: 500 });
  }
}
