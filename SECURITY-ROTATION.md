# Credential Rotation — Required Actions

`.env.local` was committed to the public repository from **2026-05-26** (commit `d8a6ded`) until this cleanup. It has now been untracked, but **the values remain in git history until the history rewrite lands, and they were publicly readable for roughly three months.**

Treat all three values as compromised. The actions below must be performed by a project owner in the respective dashboards — they cannot be automated from this repo.

## 1. Mapbox token — highest priority

**Exposed:** a `pk.*` public access token.

Public tokens are meant to be visible in client bundles, but they are **billable**. An unrestricted `pk.*` token found in a public repo can be used by anyone, charged to your account.

- Mapbox → Account → Access tokens
- **Delete** the exposed token and create a replacement
- On the new token, set **URL restrictions** to your production and preview domains (e.g. `https://*.vercel.app`, your custom domain, `http://localhost:5173`)
- Check Account → Statistics for unexpected map-load volume since 2026-05-26

## 2. Supabase anon key

**Exposed:** a legacy anon JWT for project `vvgi…`.

The anon key is public-by-design — it ships in the browser bundle regardless. Its safety depends **entirely** on Row Level Security being correct, and analysis found RLS is currently **not** correct (see below).

- **Do the RLS fixes first** — rotating the key while the policies are broken accomplishes nothing.
- Then: Supabase → Settings → API → roll the anon key, and update `VITE_SUPABASE_ANON_KEY` in Vercel's environment variables.
- Consider migrating from the legacy JWT format to the newer publishable key format at the same time.

## 3. Supabase project URL

The project ref `vvgi…` is now public. Not a secret on its own, but it tells an attacker exactly which project to point a broken-RLS probe at. Nothing to rotate — it raises the urgency of item 2.

---

## Blocking issue: RLS is currently insecure

Rotating keys will not help until these are fixed. Details and file references are in the cleanup plan; summary:

| # | Issue | Impact |
|---|---|---|
| 1 | `supabase_storage.sql` and `supabase_storage_rls.sql` create **differently-named** policies on the same `media-rutas` bucket. The drops miss, both sets coexist, and Postgres ORs permissive policies — so the weaker wins. | **Any authenticated user can upload, overwrite, and delete any media file.** |
| 2 | Avatar policies in `supabase_perfiles_extension.sql` are not scoped by owner or path. | Any authenticated user can overwrite or delete **any other user's** avatar. |
| 3 | `src/admin/AdminProtectedRoute.jsx:19-21` grants admin access when Supabase is unconfigured, and never re-checks `rol` after login. `adminAuth.js` is a bare `localStorage` flag. | Any logged-in user can set the flag and reach `/admin/panel`. RLS is the only real defense — see #1. |
| 4 | `notifyWelcome()` in `src/lib/notifications.js` passes `usuario_password` into an email template. | **Signup emails the user their own plaintext password**, transiting client → edge function → Resend → inbox. |
| 5 | `supabase/functions/send-notification` accepts an arbitrary `destinatario` with no authorization check. | Open relay: any authenticated caller can send mail from your verified Resend domain to any address. |
| 6 | `admin_config.resend_api_key` is rendered as an input at `AdminPanel.jsx:578` but never read by the edge function (which uses `Deno.env`). | Invites storing a live API key in a DB row readable by every admin session. If a key was ever entered there, **rotate it in Resend too.** |

## Checklist

- [ ] Mapbox token deleted, replaced, URL-restricted
- [ ] Mapbox usage statistics reviewed for abuse
- [ ] RLS storage policy conflict resolved (pick one policy set)
- [ ] Avatar policies scoped to owner
- [ ] Admin route guard hardened (re-check `rol`, fail closed)
- [ ] Plaintext password removed from the welcome email
- [ ] `send-notification` authorization check added
- [ ] Resend API key rotated if one was ever saved in `admin_config`
- [ ] Supabase anon key rolled **after** the above, and updated in Vercel
- [ ] Git history rewritten to purge `.env.local` from all commits
