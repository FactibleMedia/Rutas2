-- ============================================================
-- ESQUEMA COMPLETO - PANEL ADMIN RUTAS DE VALLEDUPAR
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/vvgibjfxycnngtmrvqpl/sql/new)
-- ============================================================

-- ============================================================
-- 1. TABLAS PRINCIPALES (CREAR PRIMERO TODO)
-- ============================================================

-- 3a. USUARIOS (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  correo TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('administrador', 'editor', 'viewer')),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. UBICACIONES DEL MAPA
CREATE TABLE IF NOT EXISTS ubicaciones_mapa (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL DEFAULT 'patrimonial',
  category_label TEXT NOT NULL DEFAULT 'Patrimonial',
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  cost_status TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  audience TEXT DEFAULT '',
  image TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3c. CATEGORÍAS DE RUTAS
CREATE TABLE IF NOT EXISTS categorias_rutas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  icono TEXT DEFAULT '',
  color TEXT DEFAULT '',
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3d. CONFIGURACIÓN DEL PANEL ADMIN
CREATE TABLE IF NOT EXISTS admin_config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL DEFAULT '',
  descripcion TEXT DEFAULT '',
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'numero', 'booleano', 'json', 'imagen')),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3e. REGISTRO DE ACTIVIDAD DEL ADMIN
CREATE TABLE IF NOT EXISTS actividad_admin (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  detalle TEXT DEFAULT '',
  tipo TEXT DEFAULT 'general' CHECK (tipo IN ('general', 'creacion', 'edicion', 'eliminacion', 'login', 'configuracion')),
  referencia_id TEXT DEFAULT '',
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. FUNCIÓN AUXILIAR (evita recursión infinita en RLS)
-- ============================================================
-- SECURITY DEFINER = se ejecuta como el creador (supera RLS)
-- SET search_path = '' = evita inyección cambiando el schema
-- VA DESPUÉS DE LAS TABLAS porque la función referencia usuarios

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

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE ubicaciones_mapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad_admin ENABLE ROW LEVEL SECURITY;

-- -------- ubicaciones_mapa --------
CREATE POLICY "ubicaciones_mapa_select_publico"
  ON ubicaciones_mapa FOR SELECT
  USING (true);

CREATE POLICY "ubicaciones_mapa_insert_admin"
  ON ubicaciones_mapa FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "ubicaciones_mapa_update_admin"
  ON ubicaciones_mapa FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "ubicaciones_mapa_delete_admin"
  ON ubicaciones_mapa FOR DELETE
  USING (public.es_administrador());

-- -------- usuarios --------
CREATE POLICY "usuarios_select_propio"
  ON usuarios FOR SELECT
  USING (auth.uid() = id OR public.es_administrador());

CREATE POLICY "usuarios_insert_admin"
  ON usuarios FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "usuarios_update_admin_o_propio"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id OR public.es_administrador());

-- -------- categorias_rutas --------
CREATE POLICY "categorias_select_publico"
  ON categorias_rutas FOR SELECT
  USING (true);

CREATE POLICY "categorias_insert_admin"
  ON categorias_rutas FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "categorias_update_admin"
  ON categorias_rutas FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "categorias_delete_admin"
  ON categorias_rutas FOR DELETE
  USING (public.es_administrador());

-- -------- admin_config --------
CREATE POLICY "admin_config_select_admin"
  ON admin_config FOR SELECT
  USING (public.es_administrador());

CREATE POLICY "admin_config_insert_admin"
  ON admin_config FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "admin_config_update_admin"
  ON admin_config FOR UPDATE
  USING (public.es_administrador());

-- -------- actividad_admin --------
CREATE POLICY "actividad_select_admin"
  ON actividad_admin FOR SELECT
  USING (public.es_administrador());

CREATE POLICY "actividad_insert_authenticated"
  ON actividad_admin FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 5. DATOS POR DEFECTO
-- ============================================================

-- 5a. Ubicaciones del mapa
INSERT INTO ubicaciones_mapa (id, route_id, category_label, name, subtitle, description, address, cost_status, hours, audience, image, longitude, latitude)
VALUES
  ('plaza-alfonso', 'patrimonial', 'Patrimonial', 'Plaza Alfonso Lopez', 'Corazon del Festival Vallenato.', 'Centro simbolico de Valledupar y punto de encuentro cultural para la ciudad.', 'Plaza Alfonso Lopez, Valledupar', 'Acceso Libre', 'Abierto 24h', 'Familiar', 'https://images.unsplash.com/photo-1533601017-dc61895e03c0?auto=format&fit=crop&q=80&w=900', -73.2435, 10.4631),
  ('catedral-rosario', 'patrimonial', 'Patrimonial', 'Catedral Nuestra Senora del Rosario', 'Templo historico del centro de Valledupar.', 'Uno de los referentes arquitectonicos y religiosos mas reconocidos de la ciudad.', 'Calle 15 con Carrera 7, Valledupar', 'Acceso Libre', '7:00 AM a 6:00 PM', 'Religioso y fotografico', 'https://images.unsplash.com/photo-1548625361-ecacbd74cb86?auto=format&fit=crop&q=80&w=900', -73.245, 10.465),
  ('casa-museo', 'patrimonial', 'Patrimonial', 'Casa Museo del Vallenato', 'Memoria musical y cultural de la region.', 'Espacio dedicado a la historia del vallenato y sus protagonistas.', 'Centro historico, Valledupar', 'Consulta previa', '8:00 AM a 5:00 PM', 'Turistas y melomanos', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=900', -73.2493, 10.4724),
  ('mercado-popular', 'gastronomica', 'Gastronomica', 'Mercado Popular', 'Parada clasica de cocina local.', 'Punto de sabores tradicionales para descubrir recetas y productos tipicos.', 'Sector centro, Valledupar', 'Consumo variable', '6:00 AM a 5:00 PM', 'Familiar y gastronomico', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=900', -73.2573, 10.4645),
  ('balcon-leyendas', 'mitos', 'Mitos y Leyendas', 'Balcon de Leyendas', 'Historias orales y relatos de la ciudad.', 'Escenario narrativo para la memoria oral y las historias populares del Cesar.', 'Zona centro, Valledupar', 'Acceso Libre', 'Nocturno', 'Familiar', 'https://images.unsplash.com/photo-1519764622345-23439dd774f5?auto=format&fit=crop&q=80&w=900', -73.2389, 10.4589)
ON CONFLICT (id) DO NOTHING;

-- 5b. Categorías de rutas
INSERT INTO categorias_rutas (id, nombre, descripcion, icono, color)
VALUES
  ('patrimonial', 'Patrimonial', 'Sitios históricos y culturales de Valledupar', 'landmark', 'terracota'),
  ('gastronomica', 'Gastronómica', 'Sabores y platos típicos de la región', 'restaurant', 'ambar'),
  ('mitos', 'Mitos y Leyendas', 'Historias y relatos tradicionales del Cesar', 'auto_stories', 'oliva')
ON CONFLICT (id) DO NOTHING;

-- 5c. Configuración inicial del panel admin
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES
  ('sitio_nombre', 'Rutas Vallenatas', 'Nombre del sitio cultural', 'texto'),
  ('sitio_descripcion', 'Descubre el legado cultural de Valledupar a través de sus rutas patrimoniales, gastronómicas y musicales.', 'Descripción del sitio', 'texto'),
  ('email_contacto', 'contacto@rutasvallenatas.co', 'Correo de contacto del administrador', 'texto'),
  ('items_por_pagina', '20', 'Cantidad de items por página en el panel', 'numero'),
  ('modo_mantenimiento', 'false', 'Poner el sitio en modo mantenimiento', 'booleano')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 6. ÍNDICES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ubicaciones_route_id ON ubicaciones_mapa(route_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_actividad_usuario ON actividad_admin(usuario_id);
CREATE INDEX IF NOT EXISTS idx_actividad_creado ON actividad_admin(creado_en DESC);

-- ============================================================
-- 7. CREAR USUARIO ADMINISTRADOR
-- ============================================================
-- ⚠️ SIGUE ESTOS PASOS EN ORDEN:

-- PASO 1: Ve a Authentication > Users en el dashboard de Supabase
--         y crea un usuario con:
--         Email: admin@valledupar.gov.co
--         Password: admin123

-- PASO 2: Reemplaza 'UUID-DEL-USUARIO' con el ID del usuario
--         que aparece en la lista de Authentication > Users.

-- PASO 3: Ejecuta este INSERT:

-- INSERT INTO usuarios (id, nombre, correo, rol, activo)
-- VALUES (
--   'UUID-DEL-USUARIO',  -- ← REEMPLAZA ESTO
--   'Admin Principal',
--   'admin@valledupar.gov.co',
--   'administrador',
--   true
-- );
