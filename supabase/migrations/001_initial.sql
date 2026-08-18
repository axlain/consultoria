-- =============================================================================
-- Consultoria SaaS — esquema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Roles de usuario por negocio
create table if not exists user_business_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  business_id  text not null,
  role         text not null check (role in ('client','employee','host','admin')),
  name         text not null default '',
  email        text not null default '',
  assigned_by  uuid references auth.users(id),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id, business_id)
);

-- Citas
create table if not exists appointments (
  id                text primary key,
  tenant_slug       text not null,
  service_id        text not null,
  professional_id   text not null,
  date              text not null,   -- YYYY-MM-DD
  time              text not null,   -- HH:MM
  customer_name     text not null,
  customer_last_name text not null,
  customer_phone    text not null,
  status            text not null default 'scheduled'
                    check (status in ('scheduled','completed','no_show')),
  client_user_id    uuid references auth.users(id),
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);

-- Pagos
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  appointment_id      text references appointments(id),
  business_id         text not null,
  amount_cents        integer not null check (amount_cents > 0),
  currency            text not null default 'MXN',
  status              text not null default 'pending'
                      check (status in ('pending','authorized','paid','failed','refunded','canceled')),
  provider            text not null default 'mock',
  provider_reference  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Historial de eventos de pago
create table if not exists payment_events (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references payments(id) on delete cascade,
  event_type  text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table user_business_roles enable row level security;
alter table appointments         enable row level security;
alter table payments             enable row level security;
alter table payment_events       enable row level security;

-- user_business_roles: each user sees their own rows
create policy "users see own role"
  on user_business_roles for select
  using (user_id = auth.uid());

-- appointments: client sees their own; service-role bypasses for backend
create policy "client sees own appointments"
  on appointments for select
  using (client_user_id = auth.uid());

create policy "client inserts own appointments"
  on appointments for insert
  with check (client_user_id = auth.uid() or client_user_id is null);

-- payments: NO client access — backend uses service role
-- admin access is enforced at the API layer (requireRole)

-- payment_events: same as payments
-- (service role bypasses RLS for admin/backend operations)

-- =============================================================================
-- Helper: función para asignar rol automáticamente al registrarse
-- Llamada desde un trigger de Supabase Auth
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _business_id text;
begin
  -- Extract business_id from raw_user_meta_data (passed at signup)
  _business_id := coalesce(new.raw_user_meta_data->>'business_id', 'barberia');
  insert into public.user_business_roles (user_id, business_id, role, name, email)
  values (
    new.id,
    _business_id,
    'client',
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, '')
  )
  on conflict (user_id, business_id) do nothing;
  return new;
end;
$$;

-- Trigger: se dispara al crear un usuario en Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- Usuarios semilla de prueba (insertar DESPUÉS de crear los usuarios en Auth)
-- Para crear los usuarios usa: supabase/seed_users.sql o la UI de Auth
-- =============================================================================
-- Ejemplo manual de asignación de rol admin:
-- update user_business_roles set role = 'admin' where user_id = '<uuid-del-admin>';
