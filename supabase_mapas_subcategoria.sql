-- ============================================================
-- SQL Migration: Subcategorías en Mapas + Referencia en Rutas
-- ============================================================

-- 1. Agregar subcategoria a la tabla de ubicaciones_mapa
ALTER TABLE ubicaciones_mapa 
ADD COLUMN IF NOT EXISTS subcategoria TEXT DEFAULT '';

-- 2. Agregar mapa_referencia_id a la tabla de rutas_interactivas_puntos
ALTER TABLE rutas_interactivas_puntos 
ADD COLUMN IF NOT EXISTS mapa_referencia_id TEXT DEFAULT '';

-- 3. Índice opcional para búsquedas por referencia
CREATE INDEX IF NOT EXISTS idx_rutas_puntos_mapa_ref 
ON rutas_interactivas_puntos(mapa_referencia_id);
