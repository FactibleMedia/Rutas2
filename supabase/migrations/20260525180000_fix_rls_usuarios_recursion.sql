-- ============================================================
-- FIX: Recursive RLS Policy - Panel Admin Rutas Vallenatas
-- ============================================================
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/tu-proyecto/sql/new)
-- ============================================================

-- ============================================================
-- 1. REPARAR POLÍTICAS DE USUARIOS (eliminar recursión)
-- ============================================================
-- El problema original: la política llamaba a es_administrador(),
-- que consulta la tabla usuarios, creando un ciclo infinito.
-- La solución: auth.uid() = id es suficiente para que cada usuario
-- vea/modifique su propio perfil. Los admins usan RPC functions.

-- 1a. SELECT policy - solo el usuario puede ver su propio perfil
DROP POLICY IF EXISTS "usuarios_select_propio" ON usuarios;
CREATE POLICY "usuarios_select_propio"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

-- 1b. UPDATE policy - solo el usuario puede modificar su propio perfil
DROP POLICY IF EXISTS "usuarios_update_admin_o_propio" ON usuarios;
CREATE POLICY "usuarios_update_propio"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id);

-- 1c. INSERT policy - solo administradores (no hay recursión aquí porque
--     es_administrador() se ejecuta con SECURITY DEFINER y la consulta
--     SELECT dentro de ella no activa una política INSERT)
--     Esta política se mantiene igual.
-- (ya existe: "usuarios_insert_admin" WITH CHECK (public.es_administrador()))

-- ============================================================
-- 2. CREAR RPC FUNCTIONS PARA OPERACIONES DE ADMIN
-- ============================================================
-- Estas funciones se ejecutan con SECURITY DEFINER (como el dueño de la BD)
-- y pueden hacer SELECT/UPDATE en usuarios sin activar RLS.

-- 2a. Obtener TODOS los usuarios (solo para administradores)
CREATE OR REPLACE FUNCTION public.get_all_usuarios()
RETURNS SETOF public.usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.es_administrador() THEN
    RETURN QUERY SELECT * FROM public.usuarios ORDER BY creado_en DESC;
  END IF;
  RETURN;
END;
$$;

-- 2b. Obtener usuario por ID (solo para administradores)
CREATE OR REPLACE FUNCTION public.get_usuario_por_id(uid uuid)
RETURNS SETOF public.usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.es_administrador() THEN
    RETURN QUERY SELECT * FROM public.usuarios WHERE id = uid;
  END IF;
  RETURN;
END;
$$;

-- 2c. Actualizar rol de un usuario (solo para admins)
--     La función verifica internamente que quien llama sea admin
CREATE OR REPLACE FUNCTION public.admin_update_usuario(
  uid uuid,
  updates JSONB
)
RETURNS SETOF public.usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar que el usuario que llama sea administrador
  IF NOT public.es_administrador() THEN
    RAISE EXCEPTION 'Permiso denegado: se requiere rol de administrador';
  END IF;

  -- Ejecutar la actualización
  EXECUTE format(
    'UPDATE public.usuarios SET %s WHERE id = $1',
    (
      SELECT string_agg(
        format('%I = $2::jsonb->>%L', key, key),
        ', '
      )
      FROM jsonb_object_keys(updates) AS key
    )
  ) USING uid, updates;

  RETURN QUERY SELECT * FROM public.usuarios WHERE id = uid;
END;
$$;

-- 2d. Contar usuarios registrados (solo para administradores)
CREATE OR REPLACE FUNCTION public.get_usuarios_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.es_administrador() THEN
    RETURN (SELECT COUNT(*) FROM public.usuarios);
  END IF;
  RETURN 0;
END;
$$;

-- 2e. Eliminar un usuario (solo para admins)
CREATE OR REPLACE FUNCTION public.admin_delete_usuario(uid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.es_administrador() THEN
    RAISE EXCEPTION 'Permiso denegado: se requiere rol de administrador';
  END IF;

  DELETE FROM public.usuarios WHERE id = uid;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 3. ACTUALIZAR POLÍTICA DE ACTIVIDAD_ADMIN
-- ============================================================
-- Insertar actividad_admin no debería requerir es_administrador()
-- (ya usa auth.role() = 'authenticated', está bien)

-- ============================================================
-- 4. VERIFICAR QUE LAS FUNCIONES RPC ESTÁN ACCESIBLES
-- ============================================================
-- Nota: Las funciones SECURITY DEFINER son accesibles via
-- supabase.rpc('get_all_usuarios') desde el cliente

-- Para probar (desde el panel SQL Editor):
-- SELECT * FROM get_all_usuarios();
-- SELECT * FROM get_usuario_por_id('tu-uuid-aqui');
