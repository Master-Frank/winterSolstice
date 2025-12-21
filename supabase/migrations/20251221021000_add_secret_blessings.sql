alter table public.blessings
  add column if not exists is_public boolean not null default true;

alter table public.blessings
  add column if not exists passcode_hash text;

alter table public.blessings
  add column if not exists passcode_hint text;

create unique index if not exists blessings_passcode_hash_uniq
  on public.blessings(passcode_hash)
  where passcode_hash is not null;

