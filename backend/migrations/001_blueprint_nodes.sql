
alter table shapes
  add column if not exists text_color text not null default '#FFFFFF';

alter table connections
  add column if not exists source_handle text,
  add column if not exists target_handle text;

