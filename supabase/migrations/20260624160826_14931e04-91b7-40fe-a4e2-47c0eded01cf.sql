
-- Phase 2: catalog premium + machine stock + micronutrients
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS nutrition_goals text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sodium_mg integer,
  ADD COLUMN IF NOT EXISTS sugar_g numeric,
  ADD COLUMN IF NOT EXISTS micros jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sold_count integer DEFAULT 0;

ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS opens_at text DEFAULT '06:00',
  ADD COLUMN IF NOT EXISTS closes_at text DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS temperature_c numeric DEFAULT 4;

-- machine_products: stock per machine
CREATE TABLE IF NOT EXISTS public.machine_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stock integer NOT NULL DEFAULT 0,
  slot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (machine_id, product_id)
);

GRANT SELECT ON public.machine_products TO anon, authenticated;
GRANT ALL ON public.machine_products TO service_role;
ALTER TABLE public.machine_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "machine_products readable by all"
  ON public.machine_products FOR SELECT USING (true);

CREATE TRIGGER set_machine_products_updated_at
  BEFORE UPDATE ON public.machine_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- loyalty events (scaffold for next phase)
CREATE TABLE IF NOT EXISTS public.loyalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.loyalty_events TO authenticated;
GRANT ALL ON public.loyalty_events TO service_role;
ALTER TABLE public.loyalty_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty own read" ON public.loyalty_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loyalty own insert" ON public.loyalty_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- product_views (recently viewed, server-side history scaffold)
CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON public.product_views(user_id, viewed_at DESC);
GRANT SELECT, INSERT, DELETE ON public.product_views TO authenticated;
GRANT ALL ON public.product_views TO service_role;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views own" ON public.product_views
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
