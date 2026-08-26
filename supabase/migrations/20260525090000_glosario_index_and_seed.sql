-- ============================================================
-- SCRIPT SQL - GLOSARIO VALLENATO
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tu-proyecto/sql/new)
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS glosario_palabras (
  id BIGSERIAL PRIMARY KEY,
  palabra TEXT NOT NULL,
  significado TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Para referirse'
    CHECK (categoria IN (
      'Objeto', 'Transporte', 'Material', 'Bebida', 'Alimento',
      'Animal', 'Planta', 'Gesto', 'Expresión', 'Cuerpo',
      'Para referirse', 'Vestimenta', 'Accesorio', 'Fantasía', 'Juego'
    )),
  color_postal TEXT NOT NULL DEFAULT 'verde' CHECK (color_postal IN ('verde', 'morado')),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Evitar palabras duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_glosario_palabra_unique ON glosario_palabras (LOWER(palabra));

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE glosario_palabras ENABLE ROW LEVEL SECURITY;

-- Función auxiliar (si no existe aún)
CREATE OR REPLACE FUNCTION public.es_administrador()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
      AND rol = 'administrador'
      AND activo = true
  );
$$;

-- Políticas
CREATE POLICY "glosario_select_publico"
  ON glosario_palabras FOR SELECT
  USING (true);

CREATE POLICY "glosario_insert_admin"
  ON glosario_palabras FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "glosario_update_admin"
  ON glosario_palabras FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "glosario_delete_admin"
  ON glosario_palabras FOR DELETE
  USING (public.es_administrador());

-- ============================================================
-- 3. DATOS DE EJEMPLO (opcional)
-- ============================================================

INSERT INTO glosario_palabras (palabra, significado, categoria, color_postal) VALUES
  ('Achantao', 'Avergonzado, tímido o desanimado.', 'Para referirse', 'verde'),
  ('Bacán', 'Persona agradable, de buen carácter.', 'Para referirse', 'morado'),
  ('Cachaco', 'Persona del interior del país, especialmente de Bogotá.', 'Para referirse', 'verde'),
  ('Corroncho', 'Persona de mal gusto o modales rústicos.', 'Para referirse', 'morado'),
  ('Embejucarse', 'Enojarse mucho, ponerse furioso.', 'Expresión', 'verde'),
  ('Fregado', 'Difícil, complicado o una persona molesta.', 'Para referirse', 'morado'),
  ('Guachafita', 'Desorden, fiesta bulliciosa, relajo.', 'Expresión', 'verde'),
  ('Jopo', 'Trasero. A veces usado para describir algo de mala calidad.', 'Cuerpo', 'morado'),
  ('Leva', 'Castigo físico, golpiza.', 'Para referirse', 'verde'),
  ('Mondá', 'Palabra versátil, usada para denotar sorpresa o enojo.', 'Expresión', 'morado'),
  ('Nojoda', 'Expresión de asombro, molestia o incredulidad.', 'Expresión', 'verde'),
  ('Pava', 'Mala suerte, sal.', 'Para referirse', 'morado'),
  ('Rumbear', 'Ir de fiesta.', 'Expresión', 'verde'),
  ('Sapo', 'Persona entrometida o delatora.', 'Para referirse', 'morado'),
  ('Tiesto', 'Objeto viejo o inservible.', 'Objeto', 'verde'),
  ('Vaina', 'Cosa, asunto, problema. Palabra comodín.', 'Para referirse', 'morado'),
  ('Yeyo', 'Mareo, desmayo, ataque de nervios.', 'Cuerpo', 'verde'),
  ('Zarandear', 'Mover violentamente a alguien o algo.', 'Expresión', 'morado'),
  ('Ajá', 'Expresión multifuncional: saludo, afirmación, interrogación.', 'Expresión', 'verde')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CONSULTAS ÚTILES
-- ============================================================

-- Contar palabras por categoría:
-- SELECT categoria, COUNT(*) as total FROM glosario_palabras WHERE activo = true GROUP BY categoria ORDER BY total DESC;

-- Buscar palabra:
-- SELECT * FROM glosario_palabras WHERE activo = true AND LOWER(palabra) LIKE '%busqueda%';
