-- ============================================================
-- SCRIPT SQL - USUARIOS DEL SISTEMA (Público General)
-- ============================================================
-- NOTA: Este script complementa la autenticación de Supabase Auth.
-- Los usuarios se autentican con Supabase Auth (email/password),
-- y esta tabla almacena datos adicionales del perfil.
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA DE PERFILES DE USUARIO
-- ============================================================

CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer su propio perfil
CREATE POLICY "perfiles_select_propio"
  ON perfiles_usuario FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil al registrarse
CREATE POLICY "perfiles_insert_propio"
  ON perfiles_usuario FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "perfiles_update_propio"
  ON perfiles_usuario FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 3. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, nombre, apellido, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de crear un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_nuevo_usuario();

-- ============================================================
-- 4. CONSULTAS ÚTILES
-- ============================================================

-- Obtener perfil del usuario actual:
-- SELECT * FROM perfiles_usuario WHERE id = auth.uid();

-- Contar usuarios registrados:
-- SELECT COUNT(*) FROM perfiles_usuario;
