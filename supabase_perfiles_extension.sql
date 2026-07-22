-- ============================================================
-- SCRIPT SQL - EXTENSIÓN DE PERFILES + STORAGE AVATARS
-- ============================================================
-- Ejecuta DESPUÉS de supabase_usuarios.sql
-- ============================================================

-- ============================================================
-- 1. AGREGAR COLUMNAS A perfiles_usuario
-- ============================================================

ALTER TABLE perfiles_usuario
ADD COLUMN IF NOT EXISTS ubicacion TEXT DEFAULT '';

ALTER TABLE perfiles_usuario
ADD COLUMN IF NOT EXISTS biografia TEXT DEFAULT '';

ALTER TABLE perfiles_usuario
ADD COLUMN IF NOT EXISTS foto_perfil TEXT DEFAULT '';

-- ============================================================
-- 2. CREAR BUCKET PARA AVATARES DE PERFIL
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars-perfil',
  'avatars-perfil',
  true,
  2097152, -- 2 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. POLÍTICAS DE ACCESO AL BUCKET DE AVATARES
-- ============================================================

-- Cualquiera puede leer avatares (imágenes públicas)
CREATE POLICY "avatars_select_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars-perfil');

-- Usuarios autenticados pueden subir sus propias imágenes
CREATE POLICY "avatars_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars-perfil'
    AND auth.role() = 'authenticated'
  );

-- Usuarios autenticados pueden actualizar sus propias imágenes
CREATE POLICY "avatars_update_authenticated"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars-perfil'
    AND auth.role() = 'authenticated'
  );

-- Usuarios autenticados pueden eliminar sus propias imágenes
CREATE POLICY "avatars_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars-perfil'
    AND auth.role() = 'authenticated'
  );
