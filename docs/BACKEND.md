# ECOS · Backend opcional (Supabase + Gemini)

> Rama `backend`. **Opcional:** si no configuras nada, la app funciona exactamente igual que la versión 1.0
> (todo en el navegador). Si el servidor falla o tarda, la app vuelve sola al modo local.

## Qué hace

| Pieza | Archivo | Para qué |
|---|---|---|
| Edge Function `adapt` | `supabase/functions/adapt/index.ts` + `logic.ts` | Recibe un hecho verificado de la NASA + intereses + modo y pide a **Google Gemini** una analogía de 1–2 frases en español. Valida la entrada (intereses y modos de una lista cerrada, sólo fuentes `*.nasa.gov`), CORS sólo para `https://anyxg12.github.io` y `localhost`, límite de 20 peticiones/min por IP, tiempo máximo 8 s, caché en la tabla `analogy_cache` y **post-chequeo**: descarta respuestas con cifras que no estén en el hecho, cifras en letra, comillas (citas inventadas) o enlaces. |
| Base de datos | `supabase/migrations/0001_init.sql` | Tablas `profiles` (seudónimo, modo, intereses), `progress` (logros), `analogy_cache`; función `leaderboard()` (top 50, sólo seudónimo + estrellas). RLS: cada usuario sólo lee y escribe sus filas. |
| Frontend | `src/app/backend/*`, `src/app/repositories/supabase.ts`, `AnalogyChip.tsx`, `RankingScreen.tsx` | Se activa sólo con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Cuenta **anónima** (sin correo ni datos personales). El progreso se guarda primero en el navegador y se copia al servidor. El chip «Analogía para ti · generada con IA» aparece bajo el hecho verificado; si no hay backend no se muestra. El ranking muestra «● En vivo» con datos reales o, si no hay backend, la tabla rotulada «Datos de demostración». |

**Claves:** la *anon / publishable key* es pública por diseño (la protege RLS) y puede ir en el frontend.
La **clave de Gemini** y la **service_role** NUNCA van en el frontend, en el repositorio ni en el chat: sólo en los secretos de Supabase.

## Paso a paso (Windows, con tu cuenta de Supabase)

### 1. Crear el proyecto
1. Entra a <https://supabase.com/dashboard> → **New project**. Nombre: `ecos`. Elige una contraseña de base de datos (guárdala tú) y la región más cercana (p. ej. *South America (São Paulo)*). **Create new project** y espera 1–2 min.

### 2. Crear las tablas
1. Menú izquierdo → **SQL Editor** → **New query**.
2. Abre `supabase/migrations/0001_init.sql` en tu PC, copia TODO, pégalo y pulsa **Run**. Debe decir *Success. No rows returned*.

### 3. Activar el inicio de sesión anónimo
1. **Authentication** → **Sign In / Providers** (o *Providers*) → activa **Allow anonymous sign-ins** → **Save**.

### 4. Sacar la clave de Gemini (tú, sin compartirla)
1. Entra a <https://aistudio.google.com/apikey> con tu cuenta de Google → **Create API key**. Cópiala.
2. En Supabase: **Edge Functions** → **Secrets** (o *Project Settings → Edge Functions → Secrets*) → **Add new secret**:
   - Name: `GEMINI_API_KEY` · Value: *(pega tu clave)* → **Save**.
   - Opcional: `GEMINI_MODEL` (por defecto `gemini-3.5-flash-lite`, del plan gratuito; también sirve `gemini-3.8-flash`).
   - Opcional: `ALLOWED_ORIGINS` si publicas en otro dominio (separados por coma).
   > No pegues la clave en el chat, en el código ni en GitHub.

### 5. Publicar la función `adapt`
**Opción A — desde el panel (sin instalar nada):**
1. **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre: `adapt`.
3. Borra el código de ejemplo de `index.ts` y pega el contenido de `supabase/functions/adapt/index.ts`.
4. Añade un archivo nuevo llamado **`logic.ts`** (botón *Add file* / *+*) y pega `supabase/functions/adapt/logic.ts`.
5. **Deploy function**.
6. En la función → **Details / Settings** → desactiva **Verify JWT / Enforce JWT verification** → **Save** (la función no necesita sesión; tiene su propia validación, CORS y límite).

**Opción B — con la CLI (PowerShell, en la carpeta del proyecto):**
```powershell
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy adapt --no-verify-jwt
```
(`TU_PROJECT_REF` es el texto de la URL del proyecto: `https://TU_PROJECT_REF.supabase.co`.)

### 6. Copiar URL y anon key
1. **Project Settings** → **API** (o *Data API* / *API Keys*): copia **Project URL** y la **anon public** (o *publishable*) **key**.
2. **GitHub** → repositorio `Ecos-space-apps` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
3. **Desarrollo local:** copia `.env.example` como `.env.local` (no se sube a git) y rellena los dos valores:
   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   npm.cmd run dev
   ```

### 7. Comprobar
1. Abre la app → completa el prólogo con algunos intereses → entra a una ruta (Spirit, Opportunity o ALSEP): bajo los datos verificados debe aparecer **«✦ Analogía para ti · generada con IA»** (primero un esqueleto de carga, luego el texto).
2. Ponte un seudónimo en tu perfil, consigue alguna estrella y abre **Top exploradores**: debe decir **● En vivo**.
3. Si algo no aparece: Supabase → Edge Functions → `adapt` → **Logs**. `not_configured` = falta `GEMINI_API_KEY`; `rejected` = la IA respondió con cifras inventadas y se descartó (es el control funcionando).
4. `?backend=0` en la URL fuerza el modo local para comparar.

## Subir la rama y unirla después

```powershell
git checkout backend
git push -u origin backend
```
La demo pública (GitHub Pages) sigue saliendo de `main`. Para unir el backend cuando esté probado:
```powershell
git checkout main
git pull
git merge backend
git push
```
(o abre un *Pull request* `backend → main` en GitHub y pulsa **Merge**).

## Pruebas
- `node supabase/tests/adapt.test.mjs` — validación, post-chequeo, caché, CORS y límite por IP (10 pruebas).
- `npm run build` con y sin variables de entorno.
- No se probó contra un Supabase ni un Gemini reales desde el entorno de desarrollo (no hay credenciales ahí): hay que comprobarlo con los pasos del punto 7.

---

## English summary

Optional backend on the `backend` branch. Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the app runs fully local, exactly like v1.0, and it falls back to local mode whenever the server fails.
- **Edge Function `adapt`** (Deno): validates input (whitelisted interests/modes, NASA-only source URLs), CORS for GitHub Pages + localhost, 20 req/min per IP, 8 s timeout, caches results in `analogy_cache`, calls Google Gemini (`GEMINI_API_KEY` stored only as a Supabase secret) and rejects any output containing numbers not present in the verified fact, spelled-out numbers, quotes or links.
- **Database** (`supabase/migrations/0001_init.sql`): `profiles`, `progress`, `analogy_cache`, `leaderboard()` RPC (top 50, nickname + stars only), RLS per user, anonymous auth (no email or personal data).
- **Frontend:** local-first progress synced to Supabase, "Analogy for you · generated with AI" chip under each stop's verified fact (hidden without backend), live leaderboard (falls back to labelled demo data).
- **Setup:** create project → run the SQL → enable anonymous sign-ins → add `GEMINI_API_KEY` secret → deploy `adapt` (dashboard editor with `index.ts` + `logic.ts`, JWT verification off, or `npx supabase functions deploy adapt --no-verify-jwt`) → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets and in `.env.local`.
- Not tested against real Supabase/Gemini from the dev environment.
