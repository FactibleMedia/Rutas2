-- ============================================================
-- SQL Schema: Rutas Interactivas
-- Ejecutar después de supabase_schema.sql
-- ============================================================

-- 1. Categorías de rutas interactivas
CREATE TABLE IF NOT EXISTS rutas_interactivas_categorias (
  slug TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  color TEXT DEFAULT '#8B6B4A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar categorías por defecto
INSERT INTO rutas_interactivas_categorias (slug, nombre, descripcion, color) VALUES
  ('patrimoniales', 'Rutas Patrimoniales', 'Sitios históricos y emblemáticos de Valledupar', '#8B6B4A'),
  ('gastronomica', 'Ruta Gastronómica', 'Sabores auténticos del Valle de Upar', '#C07536'),
  ('mistica', 'Ruta Mística', 'Paisajes espirituales y naturales', '#4A6B5D')
ON CONFLICT (slug) DO NOTHING;

-- 2. Puntos en el mapa
CREATE TABLE IF NOT EXISTS rutas_interactivas_puntos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_slug TEXT NOT NULL REFERENCES rutas_interactivas_categorias(slug) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  imagen_url TEXT DEFAULT '',
  -- Coordenadas en porcentaje (0-100) relativas a la imagen del mapa
  x NUMERIC(5,1) NOT NULL CHECK (x >= 0 AND x <= 100),
  y NUMERIC(5,1) NOT NULL CHECK (y >= 0 AND y <= 100),
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rutas_puntos_categoria ON rutas_interactivas_puntos(categoria_slug);
CREATE INDEX IF NOT EXISTS idx_rutas_puntos_orden ON rutas_interactivas_puntos(orden);

-- 3. Conexiones entre puntos (rutas)
CREATE TABLE IF NOT EXISTS rutas_interactivas_conexiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_slug TEXT NOT NULL REFERENCES rutas_interactivas_categorias(slug) ON DELETE CASCADE,
  nombre TEXT DEFAULT 'Ruta sin nombre',
  -- Array ordenado de IDs de puntos que forman la ruta
  puntos_orden JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rutas_conexiones_categoria ON rutas_interactivas_conexiones(categoria_slug);

-- 4. RLS (Row Level Security) - Solamente admins pueden modificar
ALTER TABLE rutas_interactivas_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_interactivas_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_interactivas_conexiones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura: todos pueden leer
CREATE POLICY "Lectura pública categorías"
  ON rutas_interactivas_categorias FOR SELECT
  USING (true);

CREATE POLICY "Lectura pública puntos"
  ON rutas_interactivas_puntos FOR SELECT
  USING (true);

CREATE POLICY "Lectura pública conexiones"
  ON rutas_interactivas_conexiones FOR SELECT
  USING (true);

-- Políticas de escritura: solo admins autenticados
CREATE POLICY "Escritura admins categorías"
  ON rutas_interactivas_categorias FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Escritura admins puntos"
  ON rutas_interactivas_puntos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Escritura admins conexiones"
  ON rutas_interactivas_conexiones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actualización admins puntos"
  ON rutas_interactivas_puntos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Actualización admins conexiones"
  ON rutas_interactivas_conexiones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Eliminación admins puntos"
  ON rutas_interactivas_puntos FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Eliminación admins conexiones"
  ON rutas_interactivas_conexiones FOR DELETE
  USING (auth.role() = 'authenticated');
