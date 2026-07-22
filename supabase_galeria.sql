-- ============================================================
-- SCRIPT SQL - GALERÍA MULTIMEDIA
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tu-proyecto/sql/new)
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA
-- ============================================================

CREATE TABLE IF NOT EXISTS galeria_multimedia (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo_sitio TEXT NOT NULL DEFAULT 'Patrimonial'
    CHECK (tipo_sitio IN ('Patrimonial', 'Gastronomico', 'Mitico', 'Historico', 'Cultural')),
  tipo_multimedia TEXT NOT NULL DEFAULT 'Fotografia'
    CHECK (tipo_multimedia IN ('Fotografia', 'Ilustracion', 'Galeria de Fotos', 'Video')),
  imagen_principal TEXT DEFAULT '',
  imagenes_galeria TEXT[] DEFAULT '{}',
  video_imagen TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  descripcion_breve TEXT DEFAULT '',
  descripcion_narrativa TEXT DEFAULT '',
  ubicacion_id TEXT DEFAULT '',
  longitud DOUBLE PRECISION DEFAULT 0,
  latitud DOUBLE PRECISION DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_galeria_tipo_sitio ON galeria_multimedia(tipo_sitio);
CREATE INDEX IF NOT EXISTS idx_galeria_activo ON galeria_multimedia(activo);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE galeria_multimedia ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "galeria_select_publico"
  ON galeria_multimedia FOR SELECT
  USING (true);

CREATE POLICY "galeria_insert_admin"
  ON galeria_multimedia FOR INSERT
  WITH CHECK (public.es_administrador());

CREATE POLICY "galeria_update_admin"
  ON galeria_multimedia FOR UPDATE
  USING (public.es_administrador());

CREATE POLICY "galeria_delete_admin"
  ON galeria_multimedia FOR DELETE
  USING (public.es_administrador());

-- ============================================================
-- 3. DATOS DE EJEMPLO (opcional)
-- ============================================================

INSERT INTO galeria_multimedia (titulo, tipo_sitio, tipo_multimedia, imagen_principal, descripcion_breve, descripcion_narrativa, ubicacion_id, longitud, latitud) VALUES
  (
    'Casa Colonial El Tique',
    'Patrimonial',
    'Fotografia',
    'https://images.unsplash.com/photo-1605338148856-787140889278?q=80&w=600&auto=format&fit=crop',
    'Una de las estructuras más antiguas y mejor conservadas de Valledupar.',
    'Sus paredes de bahareque y techo de caña brava cuentan las historias de las primeras familias que fundaron el valle. Un viaje directo al pasado colonial de nuestra tierra.',
    'plaza-alfonso',
    -73.2435,
    10.4631
  ),
  (
    'Arepas de Queso Tradicionales',
    'Gastronomico',
    'Video',
    'https://images.unsplash.com/photo-1615865417482-1d7010419349?q=80&w=600&auto=format&fit=crop',
    'El sabor inconfundible de la mañana vallenata.',
    'Preparadas con maíz pilado y abundante queso costeño, asadas al carbón para darles ese toque ahumado que despierta los sentidos.',
    '',
    -73.2573,
    10.4645
  ),
  (
    'Fundación Festival Vallenato',
    'Cultural',
    'Video',
    'https://images.unsplash.com/photo-1516280440502-0c9f11663004?q=80&w=600&auto=format&fit=crop',
    'El epicentro donde nace y se preserva el folclor.',
    'Aquí, los acordes del acordeón, la caja y la guacharaca se enseñan a las nuevas generaciones para mantener viva la leyenda.',
    'plaza-alfonso',
    -73.2435,
    10.4631
  ),
  (
    'Pescado Frito con Patacón',
    'Gastronomico',
    'Fotografia',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop',
    'Una delicia ribereña a orillas del río Guatapurí.',
    'Pescado fresco frito hasta alcanzar el dorado perfecto, acompañado de arroz de coco y patacones crujientes. La experiencia culinaria definitiva.',
    '',
    -73.2573,
    10.4645
  ),
  (
    'Sancocho Trifásico',
    'Gastronomico',
    'Fotografia',
    'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop',
    'El remedio para el alma.',
    'Un caldo espeso y sustancioso que combina res, cerdo y gallina, acompañado de vitualla (yuca, plátano, ñame y malanga).',
    '',
    -73.2573,
    10.4645
  ),
  (
    'Fachada Colorida',
    'Cultural',
    'Fotografia',
    'https://images.unsplash.com/photo-1563810156-f6c6d05f247a?q=80&w=600&auto=format&fit=crop',
    'Los colores vibrantes del Valle.',
    'Cada ventana y cada puerta es un lienzo que narra la alegría y la calidez del pueblo vallenato.',
    'plaza-alfonso',
    -73.2435,
    10.4631
  ),
  (
    'Dulces Típicos',
    'Gastronomico',
    'Fotografia',
    'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=600&auto=format&fit=crop',
    'La herencia dulce de las abuelas.',
    'Cocadas, dulce de leche, de ñame y de maduro, preparados lentamente en ollas de barro.',
    '',
    -73.2435,
    10.4631
  ),
  (
    'Casa Museo',
    'Patrimonial',
    'Fotografia',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=600&auto=format&fit=crop',
    'Espacio dedicado a la preservación de la memoria histórica.',
    'Un espacio donde el arte contemporáneo se encuentra con la tradición en el corazón de Valledupar.',
    'casa-museo',
    -73.2493,
    10.4724
  ),
  (
    'Arquitectura Moderna',
    'Historico',
    'Fotografia',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
    'El contraste de una ciudad que crece.',
    'Estructuras modernas que dialogan con el entorno tradicional, mostrando el desarrollo de Valledupar.',
    '',
    -73.245,
    10.465
  ),
  (
    'Chicharrón Carnudo',
    'Gastronomico',
    'Fotografia',
    'https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=600&auto=format&fit=crop',
    'Crujiente por fuera, suave por dentro.',
    'El chicharrón es un acompañante indispensable en las celebraciones y reuniones familiares.',
    '',
    -73.2573,
    10.4645
  ),
  (
    'Patio Interior',
    'Patrimonial',
    'Galeria de Fotos',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
    'El corazón de la vivienda tradicional.',
    'Los patios internos, llenos de sombra y frescura gracias a los frondosos árboles de mango, son el corazón de la vivienda tradicional.',
    'casa-museo',
    -73.2493,
    10.4724
  ),
  (
    'Encuentro Casual',
    'Cultural',
    'Fotografia',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
    'La comida nos une.',
    'Los restaurantes locales son los verdaderos foros sociales donde se comparte la vida, la música y el excelente sabor.',
    '',
    -73.2573,
    10.4645
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CONSULTAS ÚTILES
-- ============================================================

-- Contar por tipo de sitio:
-- SELECT tipo_sitio, COUNT(*) as total FROM galeria_multimedia WHERE activo = true GROUP BY tipo_sitio ORDER BY total DESC;

-- Filtrar por tipo de multimedia:
-- SELECT * FROM galeria_multimedia WHERE activo = true AND tipo_multimedia = 'Video';

-- Buscar por título o descripción:
-- SELECT * FROM galeria_multimedia WHERE activo = true AND (titulo ILIKE '%busqueda%' OR descripcion_breve ILIKE '%busqueda%');
