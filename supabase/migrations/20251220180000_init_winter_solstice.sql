create table if not exists public.participants (
  event text primary key,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_participant(p_event text)
returns bigint
language plpgsql
as $$
declare new_count bigint;
begin
  insert into public.participants(event, count, updated_at)
  values (p_event, 1, now())
  on conflict (event) do update
    set count = public.participants.count + 1,
        updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;

create table if not exists public.blessings (
  id bigserial primary key,
  content text not null,
  created_at timestamptz not null default now()
);
