alter table trips
  add column if not exists expenses_enabled boolean not null default true;
