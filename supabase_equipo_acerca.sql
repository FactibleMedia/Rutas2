-- ============================================================
-- SCRIPT SQL - EQUIPO ACERCA DE (CARRUSEL "CONOZCA AL EQUIPO")
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tu-proyecto/sql/new)
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA equipo_acerca
-- ============================================================

CREATE TABLE IF NOT EXISTS equipo_acerca (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  apodo TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_equipo_acerca_orden ON equipo_acerca(orden);
CREATE INDEX IF NOT EXISTS idx_equipo_acerca_activo ON equipo_acerca(activo);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE equipo_acerca ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver los miembros del equipo (público)
CREATE POLICY "equipo_select_publico"
  ON equipo_acerca FOR SELECT
  USING (true);

-- Solo administradores pueden insertar
CREATE POLICY "equipo_insert_admin"
  ON equipo_acerca FOR INSERT
  WITH CHECK (public.es_administrador());

-- Solo administradores pueden actualizar
CREATE POLICY "equipo_update_admin"
  ON equipo_acerca FOR UPDATE
  USING (public.es_administrador());

-- Solo administradores pueden eliminar
CREATE POLICY "equipo_delete_admin"
  ON equipo_acerca FOR DELETE
  USING (public.es_administrador());

-- ============================================================
-- 3. CONFIGURAR STORAGE BUCKET (si no existe)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipo-acerca',
  'equipo-acerca',
  true,
  10485760, -- 10 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para el bucket equipo-acerca
DROP POLICY IF EXISTS "equipo_select_publico" ON storage.objects;
CREATE POLICY "equipo_select_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipo-acerca');

DROP POLICY IF EXISTS "equipo_insert_admin" ON storage.objects;
CREATE POLICY "equipo_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipo-acerca'
    AND public.es_administrador()
  );

DROP POLICY IF EXISTS "equipo_update_admin" ON storage.objects;
CREATE POLICY "equipo_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'equipo-acerca'
    AND public.es_administrador()
  );

DROP POLICY IF EXISTS "equipo_delete_admin" ON storage.objects;
CREATE POLICY "equipo_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'equipo-acerca'
    AND public.es_administrador()
  );

-- ============================================================
-- 4. DATOS DE EJEMPLO (opcional)
-- ============================================================

INSERT INTO equipo_acerca (nombre, apodo, cargo, foto_url, orden) VALUES
  (
    'Stephanie De Castro',
    '(CEPPEP)',
    'Docente Líder De Investigación',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    1
  ),
  (
    'Ana Karina González',
    '(Amo Paz)',
    'Directora De Unidad Editorial',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    2
  ),
  (
    'Carlos Andrés Pérez',
    '',
    'Gestor de contenido multimedia',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=600&q=80',
    3
  );
