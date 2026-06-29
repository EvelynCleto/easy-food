
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_goal_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS body_fat_pct numeric(4,1),
  ADD COLUMN IF NOT EXISTS training_days_per_week integer,
  ADD COLUMN IF NOT EXISTS training_type text,
  ADD COLUMN IF NOT EXISTS favorite_foods text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL,
  week_start date NOT NULL DEFAULT current_date,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_calories integer,
  total_protein numeric(6,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO service_role;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal plans" ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER meal_plans_updated_at BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS meal_plans_user_week ON public.meal_plans(user_id, week_start DESC);
