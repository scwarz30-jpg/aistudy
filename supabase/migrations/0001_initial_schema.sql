create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  birth_date date,
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  weight_goal text,
  health_concerns jsonb not null default '[]'::jsonb,
  current_condition text,
  favorite_foods jsonb not null default '[]'::jsonb,
  avoided_foods jsonb not null default '[]'::jsonb,
  allergies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  condition_score integer not null,
  sleep_quality integer not null,
  stress_level integer not null,
  exercised_today boolean not null default false,
  appetite text,
  digestion text,
  symptoms jsonb not null default '[]'::jsonb,
  symptom_severity integer,
  water_intake integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  source_profile_snapshot jsonb not null,
  source_checkin_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id),
  constraint meal_plans_source_checkin_user_id_fkey
    foreign key (user_id, source_checkin_id)
    references public.daily_checkins(user_id, id)
    on delete set null (source_checkin_id)
);

create table public.meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null,
  day_index integer not null,
  date date not null,
  breakfast jsonb not null,
  lunch jsonb not null,
  dinner jsonb not null,
  snack jsonb,
  explanation text,
  constraint meal_plan_days_meal_plan_user_id_fkey
    foreign key (user_id, meal_plan_id)
    references public.meal_plans(user_id, id)
    on delete cascade,
  unique (meal_plan_id, day_index)
);

create table public.guidance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_checkin_id uuid,
  category text not null,
  title text not null,
  content text not null,
  safety_notice text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint guidance_items_source_checkin_user_id_fkey
    foreign key (user_id, source_checkin_id)
    references public.daily_checkins(user_id, id)
    on delete set null (source_checkin_id)
);

create index profiles_user_id_idx on public.profiles (user_id);
create index daily_checkins_user_id_created_at_idx on public.daily_checkins (user_id, created_at desc);
create index meal_plans_user_id_week_start_date_idx on public.meal_plans (user_id, week_start_date desc);
create index meal_plan_days_user_id_date_idx on public.meal_plan_days (user_id, date);
create index guidance_items_user_id_created_at_idx on public.guidance_items (user_id, created_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_meal_plans_updated_at
before update on public.meal_plans
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_days enable row level security;
alter table public.guidance_items enable row level security;

create policy "Users can select profiles"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert profiles"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update profiles"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete profiles"
on public.profiles
for delete
using (auth.uid() = user_id);

create policy "Users can select daily_checkins"
on public.daily_checkins
for select
using (auth.uid() = user_id);

create policy "Users can insert daily_checkins"
on public.daily_checkins
for insert
with check (auth.uid() = user_id);

create policy "Users can update daily_checkins"
on public.daily_checkins
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete daily_checkins"
on public.daily_checkins
for delete
using (auth.uid() = user_id);

create policy "Users can select meal_plans"
on public.meal_plans
for select
using (auth.uid() = user_id);

create policy "Users can insert meal_plans"
on public.meal_plans
for insert
with check (auth.uid() = user_id);

create policy "Users can update meal_plans"
on public.meal_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete meal_plans"
on public.meal_plans
for delete
using (auth.uid() = user_id);

create policy "Users can select meal_plan_days"
on public.meal_plan_days
for select
using (auth.uid() = user_id);

create policy "Users can insert meal_plan_days"
on public.meal_plan_days
for insert
with check (auth.uid() = user_id);

create policy "Users can update meal_plan_days"
on public.meal_plan_days
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete meal_plan_days"
on public.meal_plan_days
for delete
using (auth.uid() = user_id);

create policy "Users can select guidance_items"
on public.guidance_items
for select
using (auth.uid() = user_id);

create policy "Users can insert guidance_items"
on public.guidance_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update guidance_items"
on public.guidance_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete guidance_items"
on public.guidance_items
for delete
using (auth.uid() = user_id);
