# TESTING — qué se ejecutó de verdad

## Ronda final 1.0.0 (15 nov 2026, 02:40–03:45 UTC-5)

Entorno: Linux, Chrome headless + SwiftShader (GPU por software) vía `playwright-core`, contra `vite preview` del build de producción (:4175). Viewports: escritorio 1280×720 y móvil 390×844 táctil.

| Prueba | Resultado |
|---|---|
| `npm run typecheck` y `npm run build` | ✅ sin errores |
| QA completa `scripts/qa.mjs` (todas las secciones, tras los cambios de fuentes, navegación, cohete, botón y sonido) | ✅ 226 comprobaciones/capturas, **0 incidencias** (sin errores de consola, sin desbordes, sin «Próximamente») |
| Segunda pasada tras los últimos retoques (títulos ALSEP más cortos, vuelo del cohete 2,1 s): `ONLY=loop,nav,moon,opp,route` | ✅ 169 comprobaciones/capturas, **0 incidencias** |
| **Regresión de navegación `ONLY=nav`** (Junior/Explorer/Discovery): rueda hacia arriba sobre la tarjeta mientras la cámara viaja + arrastre soltado fuera del paisaje + mover el ratón sin pulsar | ✅ con el código nuevo (parada 2 → 3 estable). Con el `StoryRoute.tsx` anterior la misma prueba **falla** (vuelve a la parada anterior o salta una), lo que confirma el bug del PDF |
| Cohete de «Despegue»: aparece la capa de vuelo, sale por arriba de la pantalla y desaparece al terminar (comprobado en cada recorrido de Spirit/Opportunity) | ✅ capturas a mitad de vuelo en los 3 modos (`screenshots/despegue-vuelo-*.png`) |
| Botón «Explorar lo desconocido» (escritorio y móvil) sin desbordes | ✅ |
| Ruta ALSEP completa en 3 modos escritorio + Explorer móvil (6 instrumentos, apagado de 6, «Biografía adicional») | ✅ |
| Build servido bajo la subruta `/Ecos-space-apps/` (servidor estático local, como GitHub Pages) | ✅ universo, Luna, ficha ALSEP y Mis logros (chunk de three.js) cargan sin respuestas 4xx/5xx ni errores |
| Auditoría de enlaces `node scripts/check-links.mjs` | ✅ 26 enlaces, 26 `nasa.gov`, todos 200/206 |
| Las 4 fuentes de la Luna descargadas y leídas (HTML y PDF) para comprobar cada hecho de `alsepFacts.ts` | ✅ |

**No probado:** volumen real del sonido escuchado por una persona (el entorno no tiene salida de audio; solo se verificó que el código no lanza errores), GPU y móviles reales, Safari/Firefox, lectores de pantalla reales, el flujo de GitHub Actions en GitHub (no se hizo push) y la URL pública de GitHub Pages (aún no existe).

---

## Ronda 4 (14–15 nov 2026, UTC-5)

Mismo entorno (Chrome headless + SwiftShader, `playwright-core`, `vite preview` del build de producción en :4175). Secciones ejecutadas por lotes (máx. un proceso de QA a la vez):

| Lote | Secciones | Resultado |
|---|---|---|
| 1 | `opp,moon,route,uni` | `moon` ✅ (4 combinaciones, incl. nueva parada «quake»); `uni` mostró desbordamiento del botón de sonido en móvil por el nuevo botón «Top exploradores» → **corregido** (en ≤600 px el botón muestra sólo el icono, conserva el nombre accesible); `route` móvil Discovery falló una vez por tiempo con SwiftShader cargado |
| 1b | `route` (repetido solo) | ✅ 0 incidencias (4 combinaciones; repetir + recargar no cambia el progreso) |
| 2 | `opp,uni` | ✅ 0 incidencias (Opportunity completa con la nueva parada «Última canción» en 3 modos + Junior móvil; universo 3 modos × 2 viewports sin desbordes) |
| 3 | `loop,motion,profile,rank` | ✅ 0 incidencias. **Nuevo `rank`:** «Top exploradores» desde la cabecera (Junior/Discovery escritorio, Explorer móvil) y desde Mis logros; posición #6 de 10 con 4 estrellas reales; «Datos de demostración», «Ranking global — Pendiente», una sola fila «tú», foco inicial en el título, Esc vuelve, sin «Próximamente», sin desbordes. **Clave secreta:** crear → `ecos.secret.v1` contiene `PBKDF2-SHA-256`, sal y hash, nunca la clave; bloquear → clave incorrecta rechazada y perfil no editable; clave correcta desbloquea; el progreso no cambia |
| 4 | `seq,reduced,sync,nogl` | ✅ 0 incidencias (sincronización «1 de 11»; `?gl=0` → universo CSS; sin WebGL la ruta sigue en Canvas 2D) |

**Pasada final (después de todos los cambios, 15 nov ~01:00–01:20 UTC-5), dos lotes que cubren todas las secciones:** `loop,opp,moon,rank,uni` → 140 comprobaciones/capturas ✓, 0 incidencias; `route,motion,profile,seq,reduced,sync,nogl` → 74 ✓, 0 incidencias. Extracción limpia del zip en `/tmp/zipcheck` + `npm install` + `npm run build` ✅.

Recorridos visuales adicionales (script de ajuste, capturas revisadas a mano): ALSEP Junior 1366×768, Opportunity Explorer 1366×768, Spirit Discovery 1920×1080, Opportunity Junior 1280×720, ALSEP Discovery 1920×1080, Opportunity Discovery 1366×768, Spirit Explorer móvil 390×844, ALSEP Explorer 1280×720, Opportunity Junior móvil 390×844 (tras mover la fila de paradas arriba); «Top exploradores» y perfil con clave en Junior 1366, Explorer 1280, Discovery 1920 y Explorer móvil 390.

Fallos visuales encontrados y corregidos en esta ronda: decorados toscos/cortados a la izquierda; iconos y rótulos lejanos amontonados en el horizonte; cráteres de Explorer como manchas violetas; diálogo final con botones partidos y «Repetir ruta» cortado (Explorer); logo invisible en la cabecera Junior del ranking; desbordamiento de la cabecera móvil.

No probado en esta ronda: rendimiento real (fps) de los efectos cinematográficos de Discovery en GPU/móviles reales; el ambiente procedural de despedida/sismo escuchado por una persona; Safari/Firefox (Web Crypto PBKDF2 es estándar, pero no se ejecutó allí).

---

## Ronda 3

Entorno: Linux (box del equipo), Chromium/Chrome headless con **SwiftShader** (GPU por software) vía `playwright-core`, contra `vite preview` (build de producción) en el puerto 4175. Fecha: 14 nov 2026 (UTC-5).

Script: `scripts/qa.mjs` (`PW=<ruta a playwright-core/index.mjs> node scripts/qa.mjs`, secciones con `ONLY=`). Viewports: escritorio 1024×576 y móvil 390×844 (táctil). Las capturas quedan en `screenshots/`.

## Build
| Prueba | Resultado |
|---|---|
| `npm run build` (`tsc -b` + `vite build`) en la carpeta de trabajo | ✅ pasa |
| Extracción limpia de `ecos-app.zip` en `/tmp` + `npm install` + `npm run build` | ✅ pasa |
| El zip no contiene `node_modules`, `dist`, `screenshots` ni `*.tsbuildinfo` | ✅ verificado |

## Recorridos automáticos (todas las secciones ejecutadas)
| Sección | Qué comprueba | Resultado |
|---|---|---|
| `loop` (escritorio y móvil) | Prólogo visto → universo → Marte → foco en la señal de Spirit → ruta completa resolviendo actividades (armar, despegue, elegir con error primero, arrastrar ruta) → «Misión Spirit completada» con 3 estrellas nuevas → Mis logros «4 de 11» → 4 estrellas se encienden → tarjeta «Huellas de Spirit» → vuelta al universo | ✅ |
| `uni` (3 modos × 2 viewports) | Universo con Marte y la Luna, sin «Próximamente», superficie de Marte con ≥3 señales futuras accesibles, ficha de Opportunity con «Meridiani Planum» | ✅ |
| `moon` (3 modos escritorio + Explorer móvil) | Luna → ALSEP → ruta completa (colocar, elegir energía, red sísmica, apagado) → «Ruta ALSEP completada» → foco vuelve a la señal ALSEP → foco vuelve al botón de la Luna en el universo | ✅ (ver nota 1) |
| `opp` (3 modos escritorio + Junior móvil) | Marte → Opportunity → ruta completa (incl. «encuentra el equipo abandonado») → «Misión Opportunity completada», 3 estrellas `opportunity-*`, ninguna de Spirit → foco vuelve a su señal | ✅ |
| `route` (4 combinaciones) | Ruta de Spirit en Explorer/Discovery escritorio y Junior/Discovery móvil; repetir + recargar **no cambia** el progreso guardado; flecha → avanza; vista de lista con 7 elementos; Esc cierra | ✅ |
| `motion` | `?motion=reduce`: llegada a la superficie sin animación (~350 ms, sin botón «Saltar»); la ruta cambia de parada sin tránsito. «Saltar transición» ida y vuelta (superficie en ~2–4 ms) sin quedarse a medio zoom | ✅ (ver nota 1) |
| `profile` (escritorio y móvil) | Seudónimo + interés → «✓ Guardado en este navegador», «Clave de recuperación — Pendiente», «Datos de demostración», foco vuelve al botón Perfil, persistencia tras recargar, saludo con seudónimo, sin correo | ✅ |
| `seq` | Fotogramas clave de la secuencia de Mis logros | ✅ |
| `reduced` | Mis logros con movimiento reducido | ✅ |
| `sync` | Dos pestañas: desbloquear en una actualiza la otra («1 de 11») y persiste al recargar | ✅ |
| `nogl` | Navegador con `--disable-3d-apis`: Mis logros CSS, universo `data-render=css`, ruta de Spirit en Canvas 2D; `?gl=0` en un navegador con WebGL fuerza el universo CSS | ✅ |

Nota 1: en la primera pasada completa (dos procesos de QA en paralelo, SwiftShader muy cargado) dos comprobaciones fallaron por tiempo: el foco tras cerrar la ruta en móvil y el cambio de parada con movimiento reducido llegaron después de la espera de 300–400 ms. Se reprodujeron a mano (el foco vuelve a la señal y la parada cambia en el siguiente fotograma), se amplió la espera en el script y se volvieron a ejecutar esas secciones (resultado abajo).

## Fallos encontrados y corregidos durante estas pruebas
- La capa de señales tapaba el botón «Volver» de la superficie (no se podía pulsar con ratón).
- El universo de fondo seguía siendo enfocable detrás de la superficie y del perfil → `inert`.
- Etiquetas del universo Junior fuera de pantalla durante el zoom → ocultas al llegar.
- Etiqueta «Misión principal · disponible» desbordaba en móvil → «Misión principal».

## No probado (no afirmar)
- GPU reales / fps, Safari, Firefox, móviles físicos, lectores de pantalla reales.
- Sonido escuchado por una persona (sólo se comprobó que activarlo no da errores).
- Reproducción real del audio de Sofi en el navegador de QA (headless silenciado). Sí se comprobó que la URL de nasa.gov responde `206` con rangos y `audio/mpeg`.

## Segunda pasada de las secciones afectadas (`ONLY=moon` y `ONLY=motion`, por separado)
| Sección | Resultado |
|---|---|
| `moon` (4 combinaciones, incl. foco en móvil) | ✅ 0 incidencias |
| `motion` (movimiento reducido ~830 ms hasta la superficie; «Saltar» 3 ms) | ✅ 0 incidencias |

Resultado global: todas las secciones de `scripts/qa.mjs` terminaron con 0 incidencias abiertas.
