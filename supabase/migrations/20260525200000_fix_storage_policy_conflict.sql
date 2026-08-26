-- Closes a live security hole in the `media-rutas` storage bucket.
--
-- Two scripts created policies on storage.objects for the same bucket, under
-- DIFFERENT names:
--
--   supabase_storage.sql      -> media_select_publico / media_insert_admin
--                                media_update_admin  / media_delete_admin
--                                (writes require public.es_administrador())
--
--   supabase_storage_rls.sql  -> media_rutas_select_publico
--                                media_rutas_insert_autenticado
--                                media_rutas_update_autenticado
--                                media_rutas_delete_autenticado
--                                (writes require only auth.role() = 'authenticated')
--
-- Because the names differ, the DROP statements at the top of
-- supabase_storage_rls.sql never removed the admin policies. Both sets ended up
-- coexisting, and Postgres combines permissive policies with OR -- so the weaker
-- one wins. The net effect is that ANY logged-in user can upload to, overwrite,
-- and delete from the media-rutas bucket.
--
-- The admin-only set is the correct one: every writer of this bucket is an admin
-- screen (src/admin/RouteForm.jsx, src/admin/GalleryManager.jsx). User avatars
-- live in a separate `avatars-perfil` bucket and are unaffected by this file.
--
-- This drops the weaker set and leaves the admin set in place. It is idempotent.

DROP POLICY IF EXISTS "media_rutas_select_publico"      ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_insert_autenticado"  ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_update_autenticado"  ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_delete_autenticado"  ON storage.objects;

-- Re-assert the intended admin-only policies so this migration is self-contained
-- and safe to run against a database where only the weak set was ever applied.
DROP POLICY IF EXISTS "media_select_publico" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_admin"   ON storage.objects;
DROP POLICY IF EXISTS "media_update_admin"   ON storage.objects;
DROP POLICY IF EXISTS "media_delete_admin"   ON storage.objects;

CREATE POLICY "media_select_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-rutas');

CREATE POLICY "media_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-rutas' AND public.es_administrador());

CREATE POLICY "media_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media-rutas' AND public.es_administrador())
  WITH CHECK (bucket_id = 'media-rutas' AND public.es_administrador());

CREATE POLICY "media_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-rutas' AND public.es_administrador());
