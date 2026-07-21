export type Character = {
  id: string;
  name: string;
  image: string | null;
  creator: string | null;
  chats: string | null;
  category: string | null;
  height: number | null;
  tagline: string | null;
  relation: string | null;
  persona?: string | null;
  first_message?: string | null;
  owner_id?: string | null;
  visibility?: string | null;
};
