# ECOS — Historias que siguen viajando

**NASA Space Apps Challenge 2026 · Sangolquí** · Reto *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*

ECOS es una experiencia web interactiva que cuenta, para tres edades, las historias de los equipos que la NASA dejó en Marte y en la Luna: los rovers **Spirit** y **Opportunity** y las estaciones **ALSEP** de Apollo. Cada dato que se muestra enlaza a una fuente oficial de la NASA.

ECOS is an interactive web experience that tells, for three age groups, the stories of equipment NASA left on Mars and the Moon: the **Spirit** and **Opportunity** rovers and the Apollo **ALSEP** stations. Every fact shown links to an official NASA source.

Prólogo cinematográfico → universo → Marte (Spirit · Opportunity) o Luna (ALSEP) → ruta interactiva → **Mis logros**.
Cinematic prologue → universe → Mars (Spirit · Opportunity) or Moon (ALSEP) → interactive route → **Mis logros**.

| | |
|---|---|
| Stack | React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion · three.js · Canvas 2D · Web Audio |
| Estado / Status | Prototipo frontend terminado; backend en la siguiente fase / Frontend prototype done; backend is the next phase |
| Prototipo en línea / Live prototype | https://anyxg12.github.io/Ecos-space-apps/ (GitHub Pages; activo tras el primer despliegue / live after the first deploy) |
| Repositorio / Repository | https://github.com/Anyxg12/Ecos-space-apps |
| Licencia / License | MIT (código). Material NASA: ver créditos / MIT (code). NASA material: see credits |
| Documentos / Docs | [`CHANGELOG.md`](CHANGELOG.md) · [`TESTING.md`](TESTING.md) · [`docs/LINKS.md`](docs/LINKS.md) · [`docs/ASSETS.md`](docs/ASSETS.md) · [`docs/PROVISIONAL.md`](docs/PROVISIONAL.md) |

- [Español](#español)
- [English](#english)

---

## Español

### Estado del proyecto / Roadmap

- ✅ **Fase 1 — Prototipo frontend (esta versión):** prólogo, universos de Marte y la Luna en tres modos (Junior, Explorer, Discovery), tres historias interactivas (Spirit, Opportunity, ALSEP) con fuentes oficiales de la NASA, Mis logros, «Top exploradores» con datos de demostración y perfil local. Todo funciona en el navegador, sin servidor.
- ⏭️ **Fase 2 — Backend (siguiente):**
  - Proxy de API de IA en el servidor (las claves viven solo en el backend, nunca en el frontend ni en el repositorio).
  - Supabase: cuentas reales, autenticación y progreso sincronizado entre dispositivos (ya existen los stubs `SupabaseProgressRepository` / `SupabaseProfileRepository` con la misma interfaz).
  - Ranking global real (hoy «Top exploradores» usa «Datos de demostración»).
- Lo provisional y lo pendiente está detallado en [`docs/PROVISIONAL.md`](docs/PROVISIONAL.md).

### Inicio rápido (Windows)

Usa `npm.cmd` en PowerShell. Así evitas el error de la política de ejecución de `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev        # http://localhost:5173
npm.cmd run build      # tsc -b + vite build → dist/
npm.cmd run preview    # sirve dist/ en http://localhost:4175
```

Si aparece `EPERM` al instalar, cierra el editor o el antivirus que bloquea `node_modules`, bórralo y repite `npm.cmd install`. En macOS o Linux, usa `npm` en lugar de `npm.cmd`.

`vite.config.ts` usa `base: './'`, así que `dist/` funciona desde cualquier subcarpeta o hosting estático.

Comprobaciones: `npm run typecheck` (TypeScript) y `npm run build`.

### Despliegue (prototipo en línea, sin inicio de sesión)

La app es 100 % estática: basta con publicar `dist/`.

- **GitHub Pages (incluido):** el flujo `.github/workflows/deploy.yml` compila y publica en cada `push` a `main`. En el repositorio: *Settings → Pages → Build and deployment → Source: GitHub Actions*. El prototipo en línea queda en https://anyxg12.github.io/Ecos-space-apps/ (con `base: './'` funciona bajo la subruta `/Ecos-space-apps/`).
- **Vercel:** *Add New → Project →* importar el repositorio. Vercel detecta Vite: *Build command* `npm run build`, *Output directory* `dist`. No hace falta configuración extra ni variables de entorno.
- **Netlify u otro hosting estático:** `npm run build` y subir la carpeta `dist/`.

No hay claves ni secretos que configurar: esta versión no usa backend, autenticación ni APIs de IA.

### Subir a GitHub desde Windows (PowerShell)

El zip incluye el repositorio git ya preparado (rama `main`, remoto `origin` → `https://github.com/Anyxg12/Ecos-space-apps.git`, sin publicar):

```powershell
cd C:\ecos\ecos-app            # carpeta donde descomprimiste el zip
git status                      # debe decir: On branch main, nothing to commit
git remote -v                   # origin  https://github.com/Anyxg12/Ecos-space-apps.git
git push -u origin main         # pide iniciar sesión en GitHub la primera vez
```

Si la carpeta no trae `.git` (por ejemplo, la descomprimiste sin archivos ocultos):

```powershell
git init -b main
git add -A
git commit -m "ECOS 1.0.0: prototipo final (NASA Space Apps 2026)"
git remote add origin https://github.com/Anyxg12/Ecos-space-apps.git
git push -u origin main
```

Si GitHub rechaza el push porque el repositorio ya tiene commits (p. ej. un README creado en la web): `git pull --rebase origin main`, resuelve conflictos si los hay y repite `git push -u origin main`.

Después, en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. La pestaña **Actions** mostrará «Deploy to GitHub Pages»; al terminar (1–2 min), el prototipo en línea estará en https://anyxg12.github.io/Ecos-space-apps/.

### Recorrido completo (bucle de extremo a extremo)

1. **Prólogo:** agujero negro → logo → «señal detectada» → elección de universo → intereses → tres universos. Al completarlo se desbloquea el logro *Cruzaste el horizonte*.
2. **Universo:** dos mundos del reto, **Marte y la Luna**, en tres modos: Junior (cuento ilustrado 2D), Explorer (HUD de videojuego espacial) y Discovery (museo digital realista). Cada modo tiene su propia transición de viaje (se puede **saltar** con «Saltar transición»; con movimiento reducido es instantánea). Funciona con clic, toque y teclado; sin WebGL usa planetas CSS. Distancias y tamaños son artísticos, no a escala (se indica en pantalla).
3. **Superficie:** señales seleccionables. En Marte, **Spirit** (misión principal) y **Opportunity** (segunda misión); en la Luna, **ALSEP**. Además hay **señales futuras** tenues con candado («Señal futura: artefacto por descubrir»), sin nombres inventados. El dock abre las fichas con datos verificados.
4. **Ruta interactiva (3 historias, mismo motor `StoryRoute`):** zoom a la señal → camino 3D (Canvas 2D) por el que avanza la cámara; rueda, arrastre, ←/→, RePág/AvPág, balizas o pips. Cada parada: título, una frase, una actividad sencilla y hechos plegables con su fuente. Rotulado «Contenido provisional». Hay **vista de lista** accesible sin animación.
   - **Spirit:** construcción → despegue → nombre (audio oficial de Sofi Collis desde nasa.gov) → aterrizaje (elegir Gusev) → exploración (arrastrar la ruta) → última señal → legado.
   - **Opportunity:** construcción → despegue → nombre → aterrizaje (elegir Meridiani Planum) → **lo que quedó atrás** (encontrar módulo, paracaídas, escudo térmico y Heat Shield Rock) → tres cráteres → tormenta de 2018 → legado.
   - **ALSEP (Apollo 12):** qué era → lo que se aprendió de Apollo 11 → montar la estación → energía (RTG) → conectar los seis instrumentos → impacto planificado (sismo de calibración) → apagado de 1977 → legado. Las biografías de la tripulación aparecen plegadas en «Biografía adicional».
   - Cada historia enciende 3 estrellas en Mis logros (Historia, Actividad, Legado). Repetir una ruta no suma puntos dos veces.
   - Las actividades son juegos para recordar los hechos, **no simulaciones científicas**.
5. **Mis logros:** despegue cinematográfico de unos 10 s, que se puede saltar («Saltar transición» o Esc):
   - **Atardecer en la Tierra:** horizonte cálido, montañas y nubes.
   - **Cuenta atrás 3 · 2 · 1:** la cámara mira hacia arriba, empieza el retumbo y la imagen vibra cada vez más.
   - **Despegue:** la cámara sube como un cohete (punto de vista, sin mostrar el cohete), con destello de ignición, resplandor y aire caliente del motor bajo el encuadre, y aceleración.
   - **Atravesando las nubes:** la cámara cruza la capa de nubes iluminada por el atardecer. Aparecen estelas de velocidad.
   - **El cielo cambia** de azul a índigo y a negro mientras el resplandor del horizonte se curva. El altímetro acelera y el reloj de misión marca T−/T+.
   - **Llegada calmada a órbita:** la curvatura de la Tierra, la Vía Láctea, **la Luna y Marte** en el cielo (los dos mundos del reto; Marte rotulado «Spirit sigue allí, en el cráter Gusev»).
   - Las estrellas de los logros recién conseguidos **se encienden**.
   - *Todos los artefactos de Marte* es una estrella tenue con candado (meta futura; nunca se muestra como conseguida).
   - El botón «← Universo» (o «← Inicio») vuelve atrás.

El «Panel demo» (abajo a la izquierda, en Mis logros) puede:
- completar pasos
- repetir la entrada
- reiniciar el progreso

La etiqueta **«Datos de demostración»** sigue visible.

### Estructura

```
src/
  App.tsx              Vistas: prologue | universe | logros; puente EcosHostContext
  main.tsx             ?reset=1 borra prólogo, progreso y logros vistos
  prologue/            Prólogo, universos, superficies y rutas
    host.ts            EcosHostContext: openAchievements(), unlock(id), isUnlocked(id)
    universe/ArtifactsScreen.tsx   Superficies de Marte y Luna: señales, señales futuras y fichas
    universe/story/                Motor de rutas: StoryRoute, RouteScene (Canvas 2D), activities, SofiPlayer
    universe/ProfileScreen.tsx     Perfil local (seudónimo, edad, intereses, clave secreta local)
    universe/SecretKeyBox.tsx      Clave secreta local (hash PBKDF2-SHA-256 con sal, Web Crypto)
    universe/CineFx.tsx            Grano, viñeta y etalonaje de Discovery
  app/RankingScreen.tsx            «Top exploradores» (tu posición real + tabla de demostración)
  app/repositories/                ProfileRepository + stubs Supabase (Pendiente, sin credenciales)
    audio/soundEngine.ts           Sonido procedural (Web Audio): ambiente, microefectos y despegue
  achievements/        Componente <MisLogros/> (reutilizable)
    MisLogros.tsx      Capas DOM: estrellas-logro, líneas, tarjetas, insignias, compartir
    sky/timeline.ts    Trayectoria de cámara (matemática pura, sin three)
    sky/skyShader.ts   Shader: dispersión atmosférica, terreno, Tierra, estrellas, Vía Láctea
    sky/SkyScene.ts    Three.js: niveles de calidad, DPR adaptativo, pérdida de contexto
    sky/SkyCanvas.tsx  Carga diferida (chunk aparte), movimiento reducido, pausa en segundo plano
    components/        Tarjetas, ShareView (SVG/PNG), StarField (fallback sin WebGL)
    data/progressStore.ts  ProgressRepository + LocalStorageProgressRepository
  app/
    catalog.ts         Logros, insignias, fichas y enlaces de la app
    progress.ts        Repositorio (clave ecos.app.progress.v1) + logros vistos
    LogrosScreen.tsx   Pantalla Mis logros + Panel demo
  data/
    spirit-facts.json  Base de hechos verificados de Spirit (con fuentes)
    spiritFacts.ts     Acceso tipado; falla si se pide un id inexistente
    opportunityFacts.ts  Hechos verificados de Opportunity (NASA Science)
    alsepFacts.ts      Hechos verificados de ALSEP / Apollo 12 (4 fuentes oficiales NASA)
    stories.ts         Las tres historias (paradas, actividades, estrellas)
scripts/qa.mjs         Recorrido Playwright (opcional; requiere playwright-core)
```

### Props de `<MisLogros/>` (resumen)

| Prop | Tipo | Notas |
|---|---|---|
| `achievements` | `Achievement[]` | `id, title, activity, status: 'unlocked' \| 'locked', future?, unlockedAt?, magnitude?, badgeId?, archiveId?` |
| `badges`, `archiveCards`, `links` | arrays | insignias, fichas de archivo y líneas de la constelación (`from`, `to`) |
| `theme?` | `'junior' \| 'explorer' \| 'discovery'` | Solo se expone como `data-theme`; el aspecto es único para todas las edades |
| `demo` | `boolean` | Muestra «Datos de demostración» |
| `skipIntro`, `reducedMotion` | `boolean` | Movimiento reducido = fundido estático |
| `newlyUnlocked` | `string[]` | Ids que se encienden al llegar al espacio |
| `webgl` | `boolean` (true) | `false` fuerza el fallback CSS/SVG |
| `onSelect`, `onClose`, `onIntroEnd`, `onExit`, `exitLabel` | callbacks | |

Cuando cambia `achievements` de `locked` a `unlocked`, la estrella se enciende en vivo.

### Contrato de tiempo real (notas de integración para Antigravity)

- `ProgressRepository` (`src/achievements/data/progressStore.ts`) expone `getAchievements()`, `unlock(id)`, `reset()` y `subscribe(cb)` (el listener recibe la lista completa en cada cambio).
- Hoy se usa `LocalStorageProgressRepository`, que sincroniza pestañas con el evento `storage` (probado).
- **Supabase (no implementado):** ya existe el stub `SupabaseProgressRepository` en el mismo archivo, que lanza «no implementado». Hay que completarlo con la misma interfaz.
  - `unlock` → `upsert` en la tabla `user_achievements (user_id, achievement_id, unlocked_at)`, con RLS `user_id = auth.uid()`. Nunca pongas claves de servicio en el frontend.
  - `subscribe` → canal Realtime `postgres_changes` filtrado por `user_id`.
  - Sustitúyelo en `src/app/progress.ts`. No hacen falta otros cambios.
  - No hay auth ni ranking global todavía (la pantalla «Top exploradores» usa datos de demostración + tu posición local; la clave secreta es sólo local).
- El prólogo y el universo no conocen el repositorio: usan `useEcosHost()` (`openAchievements`, `unlock`, `isUnlocked`), que provee `App.tsx`. Para integrar en otra app, provee tu propio `EcosHostContext`.
- Los logros vistos se guardan en `ecos.app.logrosSeen.v1`. Así se decide qué estrellas «se encienden» al entrar.

### Parámetros de URL (pruebas)

| Parámetro | Efecto |
|---|---|
| `?view=logros` | Abre directamente Mis logros |
| `?skip=1` | Salta la secuencia de entrada |
| `?t=5.6` | Congela la secuencia en ese segundo (0–10,4; QA) |
| `?quality=high\|medium\|low` | Fija el nivel de calidad (desactiva el DPR adaptativo) |
| `?gl=0` | Universo y Mis logros sin WebGL (fallback CSS/SVG); las rutas usan Canvas 2D |
| `?motion=reduce` | Simula movimiento reducido |
| `?reset=1` | Borra el progreso, los logros vistos y el prólogo visto |
| `?fallback=1`, `?timescale=3`, `?watchdog=0`, `?debug=1` | Parámetros del prólogo |

### Rendimiento y accesibilidad

- three.js se carga en un chunk aparte (~138 KB gzip). El chunk principal pesa ~120 KB gzip.
- Hay tres niveles de calidad:
  - Se detectan por GPU: SwiftShader o móvil → bajo; Intel/Iris/Mali → medio.
  - El DPR es adaptativo y baja de nivel si los fotogramas son lentos.
  - El render se detiene al terminar la secuencia (0 % de GPU en reposo) y se pausa con la pestaña oculta.
- Si se pierde el contexto WebGL, la app cambia al fallback CSS/SVG.
- Las estrellas-logro son botones:
  - Tienen `aria-label` con su estado y se navegan con las flechas del teclado.
  - En pantallas táctiles, las etiquetas son siempre visibles.
- **Sonido:** apagado por defecto. Hay un solo interruptor global (prólogo, universo y Mis logros) y la preferencia se recuerda. Nunca suena sin un gesto del usuario. El nivel se subió ~2,5× en la ronda final, con compresor y limitador para evitar picos. Todo es Web Audio procedural, sin archivos de audio:
  - tic suave al pasar el ratón por un botón y clic al pulsar
  - soplo al abrir una tarjeta y campanita al encenderse un logro
  - despegue sincronizado con la imagen: tics de cuenta atrás, retumbo y sub-grave, rugido de ignición, soplo al cruzar las nubes y acorde amplio al llegar a órbita
  - con movimiento reducido, todo suena más suave y corto

### Estado

Ver `TESTING.md` (qué se ejecutó y con qué resultado) y `docs/PROVISIONAL.md` (lo que es provisional o no funciona todavía).

### Integración en Antigravity (Windows)

1. Clona el repositorio (o descomprime `ecos-app.zip`) en una carpeta sin espacios raros (p. ej. `C:\ecos\ecos-app`) y ábrela en Antigravity.
2. En la terminal integrada (PowerShell): `npm.cmd install` y luego `npm.cmd run dev`. Abre http://localhost:5173.
3. Para producción: `npm.cmd run build` → carpeta `dist/` (estática, `base: './'`).
4. Si quieres integrar sólo partes:
   - Rutas: `src/prologue/universe/story/` + `src/data/stories.ts` + `*Facts.ts`. Necesitan un `EcosHostContext` (`unlock`, `isUnlocked`, `openAchievements`).
   - Mis logros: `src/achievements/` + `src/app/catalog.ts`.
5. No cambies los ids de logros (`horizonte`, `spirit-*`, `opportunity-*`, `alsep-*`, `marte-todos`) ni las claves de `localStorage` (`ecos.app.progress.v1`, `ecos.app.logrosSeen.v1`, `ecos.prologue.v1`, `ecos.sound.v1`): así se conserva el progreso de los usuarios.
6. QA opcional: `PW=<ruta a playwright-core/index.mjs> node scripts/qa.mjs` con `npm.cmd run preview` abierto (puerto 4175). Secciones con `ONLY=loop,nav,uni,moon,opp,route,motion,profile,seq,reduced,sync,nogl`.

### Declaración de uso de IA

> Todo el código de esta app (prólogo, universos, superficies, rutas interactivas, actividades, perfil, Mis logros y efectos de sonido), los scripts de prueba y esta documentación se escribieron con asistencia de IA (Grok Bot) bajo la dirección y revisión del equipo. La dirección creativa se trabajó con ayuda de ChatGPT. La IA también ayudó a buscar y resumir fuentes de la NASA; cada hecho mostrado enlaza a su fuente y el equipo debe revisarlo. Los textos narrativos son provisionales. Los gráficos se generan por código (SVG/CSS/Canvas/WebGL) y no son imágenes generadas con IA. Los efectos de sonido son síntesis procedural con Web Audio. La única grabación es el audio oficial de la NASA en el que Sofi Collis lee su ensayo; se reproduce desde nasa.gov y **no** se ha sintetizado ni modificado. La canción «I'll Be Seeing You» (última canción enviada a Opportunity) **no** se reproduce ni se aloja: sólo se menciona como hecho con enlace a NASA; el ambiente que suena es procedural. Los efectos cinematográficos de Discovery (grano, bokeh, textura) son código, no imágenes de IA. La clave secreta local se protege con hash PBKDF2 (Web Crypto). No se usan logos de la NASA.

**Recursos generados con IA:** ninguno. La textura de la Tierra es una imagen de la NASA (ver créditos), no generada con IA. Para futuros recursos sigue disponible el mecanismo de marca de agua «IA»: con `aiGenerated: true` en una imagen, la tarjeta muestra la marca siempre. Hoy no se usa.

### Fuentes y créditos NASA

**Política de enlaces:** solo fuentes oficiales de la NASA (dominios `nasa.gov`). Todos los enlaces, dónde se usan y su estado HTTP comprobado están en [`docs/LINKS.md`](docs/LINKS.md).

- **Tierra desde órbita:** *Blue Marble: Land Surface, Shallow Water, and Shaded Topography* (2002), NASA Earth Observatory / Goddard Space Flight Center, dominio público. https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/
- **Datos de Spirit** (`src/data/spirit-facts.json`; la app enlaza cada dato a su fuente):
  - https://science.nasa.gov/mission/mer-spirit/
  - https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/
  - https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/
  - https://www.jpl.nasa.gov/news/girl-with-dreams-names-mars-rovers-spirit-and-opportunity/
  - https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/
  - https://www.jpl.nasa.gov/news/nasas-mars-rover-spirit-starts-a-new-chapter/
  - https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A
  - https://ntrs.nasa.gov/citations/20160001767
  - https://naif.jpl.nasa.gov/pub/naif/pds/data/mer2-m-spice-6-v1.0/mer2sp_1000/catalog/mission.cat
- **Datos de Opportunity** (`src/data/opportunityFacts.ts`): https://science.nasa.gov/mission/mer-opportunity/
- **Datos de ALSEP / Apollo 12** (`src/data/alsepFacts.ts`), en los tres modos:
  - https://www.nasa.gov/mission/apollo-12/
  - https://science.nasa.gov/resource/apollo-12-experiments-in-progress/
  - https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C
  - https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf (dossier de prensa de 1969: lo que describe se presenta como «el plan»)
- **Audio de Sofi Collis:** NASA/JPL, podcast «On a Mission» T4 E3 (2022), fragmento 3:48–4:13, reproducido desde nasa.gov. Ver `docs/ASSETS.md`.
- Las montañas, las nubes, el cielo, las estrellas, la Vía Láctea, la Luna y Marte de Mis logros son procedurales. No son datos astronómicos reales de un lugar ni una fecha concretos, y la Luna se dibuja algo más grande que en la realidad para que se vea. El altímetro y el reloj de misión son parte de la animación, no datos de un lanzamiento real.
- No se usan logos de la NASA. El uso de material de la NASA no implica su respaldo.

### Licencia

MIT (ver `LICENSE`). La imagen Blue Marble es de dominio público (NASA) y queda fuera de la licencia MIT.

---

## English

### Project status / Roadmap

- ✅ **Phase 1 — Frontend prototype (this version):** prologue, Mars and Moon universes in three modes, three interactive stories (Spirit, Opportunity, ALSEP) with official NASA sources, Mis logros, "Top exploradores" with demo data and a local profile. Runs entirely in the browser, no server.
- ⏭️ **Phase 2 — Backend (next):** server-side AI API proxy (keys only on the server, never in the frontend or repo); Supabase accounts, auth and cross-device progress (stubs with the same interface already exist); real global ranking (today it uses demo data).
- Provisional and pending items: [`docs/PROVISIONAL.md`](docs/PROVISIONAL.md).

### Quick start (Windows)

Use `npm.cmd` in PowerShell. This avoids the `npm.ps1` execution-policy error:

```powershell
npm.cmd install
npm.cmd run dev        # http://localhost:5173
npm.cmd run build      # tsc -b + vite build → dist/
npm.cmd run preview    # serves dist/ at http://localhost:4175
```

If `EPERM` appears while installing, close the editor or antivirus locking `node_modules`, delete it and run `npm.cmd install` again. On macOS or Linux, use `npm` instead of `npm.cmd`.

`vite.config.ts` uses `base: './'`, so `dist/` works from any subfolder or static host.

Checks: `npm run typecheck` (TypeScript) and `npm run build`.

### Deploy (live prototype, no login)

The app is fully static: publish `dist/`.

- **GitHub Pages (included):** `.github/workflows/deploy.yml` builds and publishes on every push to `main`. In the repository: *Settings → Pages → Build and deployment → Source: GitHub Actions*. The live prototype is at https://anyxg12.github.io/Ecos-space-apps/ (`base: './'` works under the `/Ecos-space-apps/` subpath).
- **Vercel:** *Add New → Project →* import the repository. Vercel detects Vite: build command `npm run build`, output directory `dist`. No extra config or environment variables needed.
- **Netlify or any static host:** `npm run build` and upload `dist/`.

There are no keys or secrets to configure: this version has no backend, authentication or AI APIs.

### Push to GitHub from Windows (PowerShell)

The zip contains a ready git repository (branch `main`, remote `origin` → `https://github.com/Anyxg12/Ecos-space-apps.git`, not pushed yet):

```powershell
cd C:\ecos\ecos-app
git status
git remote -v
git push -u origin main
```

Without a `.git` folder: `git init -b main`, `git add -A`, `git commit -m "ECOS 1.0.0"`, `git remote add origin https://github.com/Anyxg12/Ecos-space-apps.git`, `git push -u origin main`. If the push is rejected because the remote already has commits: `git pull --rebase origin main`, then push again.

Then on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. When the "Deploy to GitHub Pages" workflow finishes, the live prototype is at https://anyxg12.github.io/Ecos-space-apps/.

### Full loop (end to end)

1. **Prologue:** black hole → logo → "señal detectada" → universe choice → interests → three universes. Finishing it unlocks *Cruzaste el horizonte*.
2. **Universe:** the two worlds of the challenge, **Mars and the Moon**, in three modes: Junior (2D illustrated storybook), Explorer (space-game HUD) and Discovery (realistic digital museum). Each mode has its own travel transition (it can be **skipped** with "Saltar transición"; with reduced motion it is instant). Works with click, touch and keyboard; without WebGL it uses CSS planets. Distances and sizes are artistic, not to scale (stated on screen).
3. **Surface:** selectable signals. On Mars, **Spirit** (main mission) and **Opportunity** (second mission); on the Moon, **ALSEP**. There are also dim, locked **future signals** ("Señal futura: artefacto por descubrir") with no invented names. The dock opens fact cards.
4. **Interactive route (3 stories, same `StoryRoute` engine):** zoom into the signal → a 3D road (Canvas 2D) the camera travels along; wheel, drag, ←/→, PageUp/PageDown, beacons or pips. Each stop: title, one sentence, a simple activity and collapsible facts with their source. Labelled "Contenido provisional". An accessible **list view** shows everything without animation.
   - **Spirit:** build → launch → name (official NASA audio of Sofi Collis streamed from nasa.gov) → landing (pick Gusev) → exploration (drag the route) → last signal → legacy.
   - **Opportunity:** build → launch → name → landing (pick Meridiani Planum) → **what was left behind** (find the lander, parachute, heat shield and Heat Shield Rock) → three craters → 2018 dust storm → legacy.
   - **ALSEP (Apollo 12):** what it was → lessons from Apollo 11 → set up the station → power (RTG) → connect the six instruments → planned impact (calibration quake) → 1977 shutdown → legacy. Crew biographies sit folded under "Biografía adicional".
   - Each story ignites 3 stars in Mis logros (History, Activity, Legacy). Replaying a route never adds points twice.
   - Activities are memory games about the facts, **not scientific simulations**.
5. **Mis logros:** a cinematic ~10 s launch that can be skipped ("Saltar transición" or Esc):
   - **Sunset on Earth:** a warm horizon, mountains and clouds.
   - **Countdown 3 · 2 · 1:** the camera tilts up, the rumble builds and the shake grows.
   - **Liftoff:** the camera rises like a rocket (point of view, no rocket shown), with an ignition flash, engine glow and heat shimmer below the frame, and acceleration.
   - **Through the clouds:** the camera punches through the sunset-lit cloud deck. Speed streaks appear.
   - **The sky shifts** from blue to indigo to black while the horizon glow curves. The altimeter accelerates and a mission clock shows T−/T+.
   - **Calm arrival in orbit:** Earth's curvature, the Milky Way, and **the Moon and Mars** in the sky (the two worlds of the challenge; Mars is labelled "Spirit sigue allí, en el cráter Gusev").
   - Newly earned achievement stars **ignite**.
   - *Todos los artefactos de Marte* is a dim, locked star (a future goal; never shown as earned).
   - "← Universo" (or "← Inicio") goes back.

The "Panel demo" (bottom left, in Mis logros) can:
- complete steps
- replay the intro
- reset progress

The **"Datos de demostración"** label stays visible.

### Structure

```
src/
  App.tsx              Views: prologue | universe | logros; EcosHostContext bridge
  main.tsx             ?reset=1 clears the prologue, progress and seen achievements
  prologue/            Prologue, universes, surfaces and routes
    host.ts            EcosHostContext: openAchievements(), unlock(id), isUnlocked(id)
    universe/ArtifactsScreen.tsx   Mars and Moon surfaces: signals, future signals and cards
    universe/story/                Route engine: StoryRoute, RouteScene (Canvas 2D), activities, SofiPlayer
    universe/ProfileScreen.tsx     Local profile (pseudonym, age range, interests, local secret key)
    universe/SecretKeyBox.tsx      Local secret key (salted PBKDF2-SHA-256 hash, Web Crypto)
    universe/CineFx.tsx            Discovery grain, vignette and grading
  app/RankingScreen.tsx            "Top exploradores" (your real local position + demo table)
  app/repositories/                ProfileRepository + Supabase stubs (pending, no credentials)
    audio/soundEngine.ts           Procedural sound (Web Audio): ambience, micro effects and launch
  achievements/        Reusable <MisLogros/> component
    MisLogros.tsx      DOM layers: achievement stars, lines, cards, badges, share
    sky/timeline.ts    Camera path (pure math, no three)
    sky/skyShader.ts   Shader: atmospheric scattering, terrain, Earth, stars, Milky Way
    sky/SkyScene.ts    Three.js: quality tiers, adaptive DPR, context loss
    sky/SkyCanvas.tsx  Lazy-loaded (separate chunk), reduced motion, background pause
    components/        Cards, ShareView (SVG/PNG), StarField (no-WebGL fallback)
    data/progressStore.ts  ProgressRepository + LocalStorageProgressRepository
  app/
    catalog.ts         The app's achievements, badges, archive cards and links
    progress.ts        Repository (key ecos.app.progress.v1) + seen achievements
    LogrosScreen.tsx   Mis logros screen + demo panel
  data/
    spirit-facts.json  Verified Spirit fact base (with sources)
    spiritFacts.ts     Typed access; throws if an unknown id is requested
    opportunityFacts.ts  Verified Opportunity facts (NASA Science)
    alsepFacts.ts      Verified ALSEP / Apollo 12 facts (4 official NASA sources)
    stories.ts         The three stories (stops, activities, stars)
scripts/qa.mjs         Playwright walkthrough (optional; needs playwright-core)
```

### `<MisLogros/>` props (summary)

| Prop | Type | Notes |
|---|---|---|
| `achievements` | `Achievement[]` | `id, title, activity, status: 'unlocked' \| 'locked', future?, unlockedAt?, magnitude?, badgeId?, archiveId?` |
| `badges`, `archiveCards`, `links` | arrays | badges, archive cards and constellation lines (`from`, `to`) |
| `theme?` | `'junior' \| 'explorer' \| 'discovery'` | Only exposed as `data-theme`; one look for all ages |
| `demo` | `boolean` | Shows "Datos de demostración" |
| `skipIntro`, `reducedMotion` | `boolean` | Reduced motion = static cross-fade |
| `newlyUnlocked` | `string[]` | Ids that ignite on arrival in space |
| `webgl` | `boolean` (true) | `false` forces the CSS/SVG fallback |
| `onSelect`, `onClose`, `onIntroEnd`, `onExit`, `exitLabel` | callbacks | |

When an item in `achievements` changes from `locked` to `unlocked`, its star ignites live.

### Realtime contract (integration notes for Antigravity)

- `ProgressRepository` (`src/achievements/data/progressStore.ts`) exposes `getAchievements()`, `unlock(id)`, `reset()` and `subscribe(cb)` (the listener receives the full list on every change).
- The app currently uses `LocalStorageProgressRepository`, which syncs tabs through the `storage` event (tested).
- **Supabase (not implemented):** a `SupabaseProgressRepository` stub already exists in the same file and throws "no implementado". Complete it with the same interface.
  - `unlock` → `upsert` into a `user_achievements (user_id, achievement_id, unlocked_at)` table, with RLS `user_id = auth.uid()`. Never ship service keys in the frontend.
  - `subscribe` → a Realtime `postgres_changes` channel filtered by `user_id`.
  - Swap it in `src/app/progress.ts`. Nothing else needs to change.
  - There is no auth or global leaderboard yet.
- The prologue and universe never touch the repository: they call `useEcosHost()` (`openAchievements`, `unlock`, `isUnlocked`), which `App.tsx` provides. To embed them elsewhere, provide your own `EcosHostContext`.
- Seen achievements are stored in `ecos.app.logrosSeen.v1`. This decides which stars "ignite" on entry.

### URL parameters (testing)

| Parameter | Effect |
|---|---|
| `?view=logros` | Opens Mis logros directly |
| `?skip=1` | Skips the intro sequence |
| `?t=5.6` | Freezes the sequence at that second (0–10.4; QA) |
| `?quality=high\|medium\|low` | Forces a quality tier (disables adaptive DPR) |
| `?gl=0` | Universe and Mis logros without WebGL (CSS/SVG fallback); routes use Canvas 2D |
| `?motion=reduce` | Emulates reduced motion |
| `?reset=1` | Clears progress, seen achievements and the seen prologue |
| `?fallback=1`, `?timescale=3`, `?watchdog=0`, `?debug=1` | Prologue parameters |

### Performance and accessibility

- three.js loads in a separate chunk (~138 KB gzip). The main chunk is ~120 KB gzip.
- There are three quality tiers:
  - They are detected from the GPU: SwiftShader or mobile → low; Intel/Iris/Mali → medium.
  - DPR is adaptive and the tier drops if frames are slow.
  - Rendering stops when the sequence ends (0 % GPU at rest) and pauses while the tab is hidden.
- If the WebGL context is lost, the app switches to the CSS/SVG fallback.
- Achievement stars are buttons:
  - They have an `aria-label` with their state and can be navigated with the arrow keys.
  - On touch screens, labels are always visible.
- **Sound:** off by default. A single global toggle covers the prologue, universe and Mis logros, and the preference is remembered. Nothing plays without a user gesture. The level was raised ~2.5× in the final round, behind a compressor and a limiter to avoid peaks. Everything is procedural Web Audio, with no audio files:
  - a soft tick on mouse hover over a button and a click on press
  - an air puff when a card opens and a chime when an achievement ignites
  - a launch synced to the picture: countdown ticks, rumble and sub-bass, ignition roar, a whoosh through the clouds and a wide chord on reaching orbit
  - with reduced motion, everything is softer and shorter

### Status

See `TESTING.md` (what was run and the results) and `docs/PROVISIONAL.md` (what is provisional or not working yet).

### Integrating in Antigravity (Windows)

1. Clone the repository (or unzip `ecos-app.zip`, e.g. `C:\ecos\ecos-app`) and open the folder in Antigravity.
2. In the integrated terminal (PowerShell): `npm.cmd install`, then `npm.cmd run dev`. Open http://localhost:5173.
3. Production: `npm.cmd run build` → static `dist/` folder (`base: './'`).
4. To integrate only parts:
   - Routes: `src/prologue/universe/story/` + `src/data/stories.ts` + `*Facts.ts`. They need an `EcosHostContext` (`unlock`, `isUnlocked`, `openAchievements`).
   - Mis logros: `src/achievements/` + `src/app/catalog.ts`.
5. Do not rename achievement ids (`horizonte`, `spirit-*`, `opportunity-*`, `alsep-*`, `marte-todos`) or `localStorage` keys (`ecos.app.progress.v1`, `ecos.app.logrosSeen.v1`, `ecos.prologue.v1`, `ecos.sound.v1`), so users keep their progress.
6. Optional QA: `PW=<path to playwright-core/index.mjs> node scripts/qa.mjs` with `npm.cmd run preview` running (port 4175). Pick sections with `ONLY=loop,nav,uni,moon,opp,route,motion,profile,seq,reduced,sync,nogl`.

### AI-usage declaration

> All the code in this app (prologue, universes, surfaces, interactive routes, activities, profile, Mis logros and sound effects), the test scripts and this documentation were written with AI assistance (Grok Bot) under the team's direction and review. Creative direction was developed with help from ChatGPT. AI also helped find and summarize NASA sources; every fact shown links to its source and must be reviewed by the team. Narrative text is provisional. Graphics are generated by code (SVG/CSS/Canvas/WebGL) and are not AI-generated images. Sound effects are procedural Web Audio synthesis. The only recording is NASA's official audio of Sofi Collis reading her essay; it is streamed from nasa.gov and was **not** synthesized or altered. The song "I'll Be Seeing You" (Opportunity's last wake-up song) is **not** played or hosted: it is only mentioned as a fact linking to NASA; the ambience is procedural. Discovery's cinematic effects (grain, bokeh, texture) are code, not AI images. The local secret key is stored only as a salted PBKDF2 hash (Web Crypto). No NASA logos are used.

**AI-generated assets:** none. The Earth texture is a NASA image (see credits), not AI-generated. The "IA" watermark mechanism remains available for future assets: with `aiGenerated: true` on an image, the card always shows the mark. It is unused today.

### NASA sources and credits

**Link policy:** official NASA sources only (`nasa.gov` domains). Every link, where it is used and its checked HTTP status is listed in [`docs/LINKS.md`](docs/LINKS.md).

- **Earth from orbit:** *Blue Marble: Land Surface, Shallow Water, and Shaded Topography* (2002), NASA Earth Observatory / Goddard Space Flight Center, public domain. https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/
- **Spirit facts:** see the source list in the Spanish section above. Each fact in the app links to its source.
- **Opportunity facts** (`src/data/opportunityFacts.ts`): https://science.nasa.gov/mission/mer-opportunity/
- **ALSEP / Apollo 12 facts** (`src/data/alsepFacts.ts`), in all three modes: NASA Apollo 12 mission page, NASA Science "Apollo 12 Experiments in Progress", NSSDCA 1969-099C and the 1969 Apollo 12 press kit (PDF). URLs in the Spanish section and in `docs/LINKS.md`.
- **Sofi Collis audio:** NASA/JPL podcast "On a Mission" S4E3 (2022), excerpt 3:48–4:13, streamed from nasa.gov. See `docs/ASSETS.md`.
- The mountains, clouds, sky, stars, Milky Way, Moon and Mars in Mis logros are procedural. They are not real astronomical data for a specific place or date, and the Moon is drawn somewhat larger than in reality so it can be seen. The altimeter and mission clock are part of the animation, not data from a real launch.
- No NASA logos are used. Use of NASA material does not imply endorsement.

### License

MIT (see `LICENSE`). The Blue Marble image is public domain (NASA) and is excluded from the MIT license.
