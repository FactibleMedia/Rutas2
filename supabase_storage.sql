-- ============================================================
-- CONFIGURACIÓN DE STORAGE + ACTUALIZACIÓN DE TABLA
-- ============================================================
-- Ejecuta esto DESPUÉS de supabase_schema.sql
-- ============================================================

-- ============================================================
-- 1. CREAR BUCKET PARA FOTOS Y VIDEOS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-rutas',
  'media-rutas',
  true,
  52428800, -- 50 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. POLÍTICAS DE ACCESO AL BUCKET
-- ============================================================

-- Cualquiera puede leer archivos (imágenes públicas)
CREATE POLICY "media_select_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-rutas');

-- Solo administradores pueden subir archivos
CREATE POLICY "media_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-rutas'
    AND public.es_administrador()
  );

-- Solo administradores pueden actualizar archivos
CREATE POLICY "media_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media-rutas'
    AND public.es_administrador()
  );

-- Solo administradores pueden eliminar archivos
CREATE POLICY "media_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-rutas'
    AND public.es_administrador()
  );

-- ============================================================
-- 3. AGREGAR COLUMNA IMAGES A UBICACIONES_MAPA
-- ============================================================

ALTER TABLE ubicaciones_mapa
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE ubicaciones_mapa
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Actualizar las ubicaciones existentes con su imagen principal como array
UPDATE ubicaciones_mapa
SET images = ARRAY[image]
WHERE images IS NULL OR images = '{}';
