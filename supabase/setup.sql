-- Álbum dinámico · endurecimiento (aplicado el 2026-09-25 como migración "album_endurecer_politicas")
-- Proyecto: fhnnqmbbeeobassvfeox ("Invitacion Boda Demo"). Idempotente.

-- 1) Bucket público con límite de 2 MB y solo imágenes
update storage.buckets
   set public = true, file_size_limit = 2097152,
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'fotos-album';

-- 2) Sin UPDATE anónimo (nadie reemplaza fotos ajenas) y sin subida abierta a cualquier bucket.
--    Queda "Permitir subida anonima al album" (insert solo en bucket fotos-album).
drop policy if exists "Permitir actualizacion en album" on storage.objects;
drop policy if exists "Allow Anonymous Uploads 13hzvgx_0" on storage.objects;

-- 3) La tabla solo acepta URLs de este bucket (evita inyectar enlaces o código).
--    Las políticas permisivas se combinan con OR, por eso se quitan las de "with check (true)".
drop policy if exists "Public Insert" on public.fotos;
drop policy if exists "Permitir insercion anonima de fotos" on public.fotos;
drop policy if exists "Insercion anonima validada" on public.fotos;
create policy "Insercion anonima validada" on public.fotos
  for insert to anon
  with check (
    url like 'https://fhnnqmbbeeobassvfeox.supabase.co/storage/v1/object/public/fotos-album/%'
    and url !~ '[^A-Za-z0-9_./:-]'
    and char_length(album_id) between 1 and 64
  );

-- 4) Índice para la galería paginada por álbum
create index if not exists fotos_album_fecha_idx on public.fotos (album_id, created_at desc);

-- Verificación
select policyname, cmd, roles, with_check from pg_policies where tablename in ('fotos', 'objects') order by tablename, cmd;
