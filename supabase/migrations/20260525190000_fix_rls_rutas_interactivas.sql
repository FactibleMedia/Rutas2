-- ============================================================
-- FIX: RLS - Error al guardar en Rutas Interactivas
-- ============================================================
-- Error reportado: "new row violates row-level security policy
-- for table 'rutas_interactivas_puntos'"
--
-- Causa: la política de escritura exige una sesión autenticada
-- (auth.role() = 'authenticated'). Si las políticas no existen,
-- están incompletas o la sesión está expirada, el INSERT falla
-- con este error.
--
-- 👉 Ejecuta TODO este script en el SQL Editor de Supabase:
--    https://supabase.com/dashboard/project/tu-proyecto/sql/new
-- ============================================================

-- ============================================================
-- 1. ASEGURAR QUE RLS ESTÉ HABILITADO
-- ============================================================
ALTER TABLE rutas_interactivas_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_interactivas_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_interactivas_conexiones ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES (para recrearlas limpias)
-- ============================================================
DROP POLICY IF EXISTS "Lectura pública categorías" ON rutas_interactivas_categorias;
DROP POLICY IF EXISTS "Escritura admins categorías" ON rutas_interactivas_categorias;

DROP POLICY IF EXISTS "Lectura pública puntos" ON rutas_interactivas_puntos;
DROP POLICY IF EXISTS "Escritura admins puntos" ON rutas_interactivas_puntos;
DROP POLICY IF EXISTS "Actualización admins puntos" ON rutas_interactivas_puntos;
DROP POLICY IF EXISTS "Eliminación admins puntos" ON rutas_interactivas_puntos;

DROP POLICY IF EXISTS "Lectura pública conexiones" ON rutas_interactivas_conexiones;
DROP POLICY IF EXISTS "Escritura admins conexiones" ON rutas_interactivas_conexiones;
DROP POLICY IF EXISTS "Actualización admins conexiones" ON rutas_interactivas_conexiones;
DROP POLICY IF EXISTS "Eliminación admins conexiones" ON rutas_interactivas_conexiones;

-- ============================================================
-- 3. LECTURA: pública para todos
-- ============================================================
CREATE POLICY "Lectura pública categorías"
  ON rutas_interactivas_categorias FOR SELECT
  USING (true);

CREATE POLICY "Lectura pública puntos"
  ON rutas_interactivas_puntos FOR SELECT
  USING (true);

CREATE POLICY "Lectura pública conexiones"
  ON rutas_interactivas_conexiones FOR SELECT
  USING (true);

-- ============================================================
-- 4. ESCRITURA: SOLO administradores (es_administrador)
-- ============================================================
-- Se usa public.es_administrador() (igual que el resto del panel)
-- en lugar de auth.role() = 'authenticated', para que solo los
-- administradores registrados en la tabla usuarios puedan escribir.

CREATE POLICY "Escritura admins categorías"
  ON rutas_interactivas_categorias FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "Escritura admins puntos"
  ON rutas_interactivas_puntos FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "Escritura admins conexiones"
  ON rutas_interactivas_conexiones FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "Actualización admins puntos"
  ON rutas_interactivas_puntos FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "Actualización admins conexiones"
  ON rutas_interactivas_conexiones FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "Eliminación admins puntos"
  ON rutas_interactivas_puntos FOR DELETE
  USING (public.es_administrador());

CREATE POLICY "Eliminación admins conexiones"
  ON rutas_interactivas_conexiones FOR DELETE
  USING (public.es_administrador());

-- ============================================================
-- 5. VERIFICACIÓN (opcional, desde el mismo SQL Editor)
-- ============================================================
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename LIKE 'rutas_interactivas_%'
-- ORDER BY tablename, cmd;
--
-- Nota: si después de ejecutar esto el error persiste, la causa
-- es que la sesión del navegador expiró. Cierra sesión en el
-- panel admin y vuelve a iniciarla.
