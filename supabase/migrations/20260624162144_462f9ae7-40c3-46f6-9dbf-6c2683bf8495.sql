
-- Profiles enhancements
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS sex text,
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

-- Nutritional analysis enhancements
ALTER TABLE public.nutritional_analysis
  ADD COLUMN IF NOT EXISTS score numeric(3,1),
  ADD COLUMN IF NOT EXISTS ai_suggestions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meal_type text;

-- Machines enhancements
ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS queue_size integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_refill_at timestamptz;

-- Water logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml integer NOT NULL CHECK (amount_ml > 0),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own water logs" ON public.water_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS water_logs_user_time ON public.water_logs(user_id, logged_at DESC);

-- Weight logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg > 0),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weight logs" ON public.weight_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weight_logs_user_time ON public.weight_logs(user_id, logged_at DESC);

-- Achievements catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  xp_reward integer NOT NULL DEFAULT 50,
  tier text NOT NULL DEFAULT 'bronze',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements readable" ON public.achievements FOR SELECT
  TO authenticated, anon USING (true);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user achievements" ON public.user_achievements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed achievements
INSERT INTO public.achievements (code, title, description, icon, xp_reward, tier) VALUES
  ('first_meal', 'Primeira Refeição', 'Analisou sua primeira refeição com IA', 'sparkles', 50, 'bronze'),
  ('streak_3', 'Consistência', '3 dias consecutivos usando o EasyFood', 'flame', 100, 'bronze'),
  ('streak_7', 'Em Chamas', '7 dias consecutivos', 'flame', 250, 'silver'),
  ('streak_30', 'Lendário', '30 dias consecutivos', 'flame', 1000, 'gold'),
  ('water_goal', 'Bem Hidratado', 'Bateu a meta de água do dia', 'droplet', 75, 'bronze'),
  ('protein_goal', 'Forte como Boi', 'Bateu a meta de proteína do dia', 'dumbbell', 75, 'bronze'),
  ('first_order', 'Primeiro Pedido', 'Comprou na máquina pela primeira vez', 'shopping-bag', 100, 'bronze'),
  ('orders_10', 'Cliente Fiel', '10 pedidos completados', 'crown', 300, 'silver'),
  ('healthy_week', 'Semana Saudável', 'Nota média 8+ por 7 dias', 'leaf', 500, 'gold')
ON CONFLICT (code) DO NOTHING;
