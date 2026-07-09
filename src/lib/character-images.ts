import { characters as localCharacters } from "@/lib/mock-data";

export const imageById = new Map(localCharacters.map((c) => [c.id, c.image]));

export function resolveImage(id: string, image: string | null | undefined) {
  return image || imageById.get(id) || "/placeholder.png";
}
