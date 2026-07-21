CREATE TABLE public.chat_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.chat_rate_limits TO service_role;
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(
  _key TEXT,
  _limit INTEGER,
  _window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now TIMESTAMPTZ := now();
  _row public.chat_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.chat_rate_limits (bucket_key, count, window_start)
  VALUES (_key, 1, _now)
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    count = CASE
      WHEN public.chat_rate_limits.window_start < _now - make_interval(secs => _window_seconds)
        THEN 1
      ELSE public.chat_rate_limits.count + 1
    END,
    window_start = CASE
      WHEN public.chat_rate_limits.window_start < _now - make_interval(secs => _window_seconds)
        THEN _now
      ELSE public.chat_rate_limits.window_start
    END
  RETURNING * INTO _row;

  RETURN _row.count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.check_chat_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_chat_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;