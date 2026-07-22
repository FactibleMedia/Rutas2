-- ============================================================
-- SCRIPT SQL - ARREGLAR POLÍTICAS RLS DEL STORAGE BUCKET
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tu-proyecto/sql/new)
-- ============================================================
-- ⚠️ PASO 1: Crear el bucket manualmente en el Dashboard:
--   Storage → New Bucket → Name: "media-rutas" → Public bucket: ON
--
-- ⚠️ PASO 2: Luego ejecutar SOLO este script en SQL Editor
-- ============================================================

-- ============================================================
-- 1. ELIMINAR POLÍTICAS EXISTENTES (para evitar conflictos)
-- ============================================================

DROP POLICY IF EXISTS "media_rutas_select_publico" ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_insert_autenticado" ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_update_autenticado" ON storage.objects;
DROP POLICY IF EXISTS "media_rutas_delete_autenticado" ON storage.objects;

-- ============================================================
-- 2. POLÍTICAS DE SEGURIDAD
-- ============================================================

-- Cualquier persona puede VER (leer) archivos públicos
CREATE POLICY "media_rutas_select_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-rutas');

-- Usuarios autenticados pueden SUBIR archivos
CREATE POLICY "media_rutas_insert_autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-rutas'
    AND auth.role() = 'authenticated'
  );

-- Usuarios autenticados pueden ACTUALIZAR archivos
CREATE POLICY "media_rutas_update_autenticado"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media-rutas'
    AND auth.role() = 'authenticated'
  );

-- Usuarios autenticados pueden ELIMINAR archivos
CREATE POLICY "media_rutas_delete_autenticado"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-rutas'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 3. VERIFICAR POLÍTICAS (opcional)
-- ============================================================
-- SELECT * FROM storage.policies WHERE bucket_id = 'media-rutas';
