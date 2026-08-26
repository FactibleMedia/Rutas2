-- ============================================================
-- SCRIPT SQL - SUGERENCIAS DE PALABRAS DEL GLOSARIO
-- ============================================================
-- Ejecuta DESPUÉS de supabase_glosario.sql
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA DE SUGERENCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS glosario_sugerencias (
  id BIGSERIAL PRIMARY KEY,
  palabra TEXT NOT NULL,
  significado TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Para referirse'
    CHECK (categoria IN (
      'Objeto', 'Transporte', 'Material', 'Bebida', 'Alimento',
      'Animal', 'Planta', 'Gesto', 'Expresión', 'Cuerpo',
      'Para referirse', 'Vestimenta', 'Accesorio', 'Fantasía', 'Juego'
    )),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  revisado_en TIMESTAMPTZ,
  revisado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE glosario_sugerencias ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede insertar sugerencias
CREATE POLICY "sugerencias_insert_authenticated"
  ON glosario_sugerencias FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden ver sus propias sugerencias
CREATE POLICY "sugerencias_select_propio"
  ON glosario_sugerencias FOR SELECT
  USING (auth.uid() = usuario_id OR public.es_administrador());

-- Solo administradores pueden actualizar (aprobar/rechazar)
CREATE POLICY "sugerencias_update_admin"
  ON glosario_sugerencias FOR UPDATE
  USING (public.es_administrador());

-- Solo administradores pueden eliminar sugerencias
CREATE POLICY "sugerencias_delete_admin"
  ON glosario_sugerencias FOR DELETE
  USING (public.es_administrador());

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sugerencias_estado ON glosario_sugerencias(estado);
CREATE INDEX IF NOT EXISTS idx_sugerencias_usuario ON glosario_sugerencias(usuario_id);
