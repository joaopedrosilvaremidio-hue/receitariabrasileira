"use client";

import { useState } from "react";

type Ingredient = { name: string; quantity: string | null };

export default function IngredientChecklist({ ingredients }: { ingredients: Ingredient[] }) {
  const [checked, setChecked] = useState<number[]>([]);

  function toggleIngredient(index: number) {
    setChecked(current =>
      current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index]
    );
  }

  return (
    <ul className="mt-5 space-y-3">
      {ingredients.map((item, index) => {
        const isChecked = checked.includes(index);
        return (
          <li key={index} className="border-b border-white/10 pb-3">
            <label className="flex cursor-pointer items-start gap-3 text-zinc-200">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleIngredient(index)}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-red-500"
                aria-label={`Marcar ingrediente: ${item.name}`}
              />
              <span className={isChecked ? "text-zinc-500 line-through" : ""}>
                {item.quantity ? item.quantity + " — " : ""}{item.name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
