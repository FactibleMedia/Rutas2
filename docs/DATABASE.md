# Database

## What changed

Previously there were **15 loose `.sql` files at the repo root**, each headed with a comment saying "Ejecuta TODO este script en el SQL Editor de Supabase." There was no ordering scheme, no idempotency, and no record of which had actually been applied to the live project. `supabase/` was not a CLI project — it held one edge function and nothing else.

Those files are now `supabase/migrations/`, timestamped in dependency order, with `supabase/config.toml` added so the Supabase CLI can drive them.

**No SQL content was rewritten during the move** except for the new conflict-fix migration described below. The files still carry their original text, including their original header comments.

## Migration order

| # | Migration | Notes |
|---|---|---|
| 1 | `base_schema` | `usuarios`, `ubicaciones_mapa`, `categorias_rutas`, `admin_config`, `actividad_admin`, `glosario_palabras`, `es_administrador()`, seeds, indexes |
| 2 | `perfiles_usuario` | `perfiles_usuario` + `on_auth_user_created` trigger |
| 3 | `perfiles_usuario_extension` | ALTERs #2, creates `avatars-perfil` bucket |
| 4 | `glosario_index_and_seed` | **Partially duplicates #1** — see below |
| 5 | `glosario_sugerencias` | needs `es_administrador()` from #1 |
| 6 | `galeria_multimedia` | needs `es_administrador()` from #1 |
| 7 | `equipo_acerca` | needs `es_administrador()` from #1 |
| 8 | `rutas_interactivas` | 3 `rutas_interactivas_*` tables |
| 9 | `mapas_subcategoria` | ALTERs #1 and #8 |
| 10 | `storage_media_rutas` | `media-rutas` bucket + admin policies |
| 11 | `seed_config_notificaciones` | data only; ~19 KB is embedded HTML email templates |
| 12 | `seed_config_bienvenida` | data only |
| 13 | `fix_rls_usuarios_recursion` | supersedes `usuarios` policies from #1 |
| 14 | `fix_rls_rutas_interactivas` | supersedes write policies from #8 |
| 15 | `fix_storage_policy_conflict` | **new** — closes a live security hole |

## Known issues carried over

These were **not** fixed during the move — they need review and testing against real data first.

### 1. Not idempotent

Most migrations use bare `CREATE POLICY` with no `DROP POLICY IF EXISTS`. Re-running any of them throws `42710 policy already exists`. Tables use `CREATE TABLE IF NOT EXISTS`, so only the policies are affected. Only migrations 13, 14, and the new 15 drop first.

**This means `supabase db reset` will not currently succeed twice in a row.** Adding `DROP POLICY IF EXISTS` ahead of every `CREATE POLICY` is the fix and should be the next piece of work here.

### 2. Migration 4 duplicates migration 1

`glosario_index_and_seed` re-declares the whole `glosario_palabras` table and **four identically-named policies** already created in `base_schema`, plus a second definition of `es_administrador()`. Only two things in it are unique and wanted: the `idx_glosario_palabra_unique` `LOWER(palabra)` index, and 19 seed words. The rest should be deleted once verified against the live schema.

### 3. `usuarios.rol` default violates its own CHECK

```sql
rol TEXT DEFAULT 'usuario' CHECK (rol IN ('administrador','editor','viewer'))
```

`'usuario'` is not in the allowed set, so any `INSERT INTO usuarios` that omits `rol` fails. `src/AuthModal.jsx:89` inserts into this table — it currently works only because it always supplies `rol` explicitly. Fix the default (probably to `'viewer'`) or widen the CHECK.

### 4. Two parallel user tables

`usuarios` and `perfiles_usuario` both key off `auth.users(id)` and both store a name and email. `ProfileModal.jsx`, `TopBar.jsx`, `AuthModal.jsx`, and `MisAportes.jsx` each read and write **both** in sequence, so they can silently drift. The `handle_nuevo_usuario()` trigger populates only `perfiles_usuario`. This is a schema design defect, not just duplication, and consolidating them is a real refactor.

### 5. `admin_update_usuario()` allows privilege escalation

In `fix_rls_usuarios_recursion`, the function builds dynamic SQL from arbitrary JSONB keys. `%I` blocks injection, but **any key the caller passes becomes a settable column — including `rol`**. It only checks that the *caller* is an admin, so this is admin→admin escalation rather than an anonymous hole. It also casts everything to text via `->>`, which will fail on the boolean `activo` and on timestamp columns.

### 6. `rutas_interactivas_categorias` has no UPDATE or DELETE policy

`fix_rls_rutas_interactivas` correctly tightened writes to admins, but left this table insert-and-read-only. Categories can never be edited or removed.

### 7. Avatar policies are not scoped by owner

Policies on the `avatars-perfil` bucket check only `auth.role() = 'authenticated'`, with no owner or path scoping — so any authenticated user can overwrite or delete **any other user's** avatar.

## Edge function

`supabase/functions/send-notification/` sends templated email via Resend. Two problems:

- It accepts an arbitrary `destinatario` from the request body with **no authorization check on who may email whom**. Any authenticated caller can send mail from your verified domain to any address.
- `admin_config.resend_api_key` is rendered as a password input at `AdminPanel.jsx:578`, but the function never reads it — it uses `Deno.env.get("RESEND_API_KEY")`. The UI therefore invites storing a live API key in a database row that every admin session can read back. If a key was ever entered there, rotate it.

Separately, `notifyWelcome()` in `src/lib/notifications.js` passes `usuario_password` into the template, so **signup emails the user their own plaintext password**.

## Applying

```bash
supabase link --project-ref <ref>
supabase db push          # apply pending migrations to the linked project
supabase db reset         # rebuild locally from scratch (see issue 1)
```

`docs/SUPERSEDED_supabase_storage_rls.sql` is kept for reference only. **Do not apply it** — it is the file that created the conflicting weak policies that migration 15 removes.
