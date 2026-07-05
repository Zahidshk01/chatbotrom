
CREATE TABLE public.characters (
  id text PRIMARY KEY,
  name text NOT NULL,
  creator text,
  chats text,
  category text,
  height integer,
  tagline text,
  relation text,
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.characters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters are publicly readable"
  ON public.characters FOR SELECT
  USING (true);
