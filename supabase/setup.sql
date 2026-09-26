-- Álbum dinámico · endurecimiento (idempotente)
-- Proyecto: fhnnqmbbeeobassvfeox ("Invitacion Boda Demo")
-- Ejecutar en Supabase > SQL Editor después de reactivar el proyecto.

-- 1) Bucket público con límite de 2 MB y solo imágenes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-album', 'fotos-album', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Nadie anónimo puede reemplazar fotos ya subidas
drop policy if exists "Permitir actualización en álbum" on storage.objects;

-- 3) Subida anónima solo dentro del bucket del álbum
drop policy if exists "Permitir subida anónima al álbum" on storage.objects;
create policy "Permitir subida anónima al álbum"
on storage.objects for insert to anon
with check (bucket_id = 'fotos-album');

-- 4) La tabla solo acepta URLs de este bucket (evita inyectar enlaces o código)
alter table public.fotos enable row level security;
drop policy if exists "Permitir inserción anónima de fotos" on public.fotos;
create policy "Permitir inserción anónima de fotos"
on public.fotos for insert to anon
with check (
  url like 'https://fhnnqmbbeeobassvfeox.supabase.co/storage/v1/object/public/fotos-album/%'
  and url !~ '[^A-Za-z0-9_./:-]'
  and char_length(album_id) between 1 and 64
);

-- 5) Índice para la galería paginada por álbum
create index if not exists fotos_album_fecha_idx on public.fotos (album_id, created_at desc);

-- 6) Tiempo real para la tabla (ignorar el error si ya está agregada)
do $$ begin
  alter publication supabase_realtime add table public.fotos;
exception when duplicate_object then null;
end $$;

-- Verificación
select policyname, cmd, roles from pg_policies where tablename in ('fotos', 'objects') order by tablename, cmd;
