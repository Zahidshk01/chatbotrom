import { CharacterCard } from "./CharacterCard";
import type { Character } from "@/lib/mock-data";

export function MasonryGrid({ items }: { items: Character[] }) {
  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 === 1);
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <div>{col1.map((c) => <CharacterCard key={c.id} char={c} />)}</div>
      <div>{col2.map((c) => <CharacterCard key={c.id} char={c} />)}</div>
    </div>
  );
}
