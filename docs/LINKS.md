# Auditoría de enlaces / Link audit

Generado con `node scripts/check-links.mjs` el 15 de noviembre de 2026 (hora de Ecuador). Se listan **todas** las URL externas del código y la documentación (se excluyen el espacio de nombres SVG del W3C, `localhost` y los enlaces del propio proyecto: el repositorio https://github.com/Anyxg12/Ecos-space-apps y el prototipo en línea https://anyxg12.github.io/Ecos-space-apps/, que no son fuentes de datos).

Regla del proyecto: solo fuentes **oficiales de la NASA** (dominios `nasa.gov`), sin parámetros de seguimiento (`utm_*`). HTTP 206 = respuesta parcial correcta (el script pide solo los primeros 2 KB de cada recurso).

**Resumen:** 26 enlaces · 26 oficiales NASA · 26 responden 2xx/3xx · 0 con incidencias.

| # | URL | Dónde se usa | HTTP | Oficial NASA | Nota |
|---|---|---|---|---|---|
| 1 | https://naif.jpl.nasa.gov/pub/naif/pds/data/mer2-m-spice-6-v1.0/mer2sp_1000/catalog/mission.cat | `README.md`<br>`src/data/spirit-facts.json` | 206 | Sí | — |
| 2 | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C | `README.md`<br>`src/data/alsepFacts.ts` | 200 | Sí | — |
| 3 | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A | `README.md`<br>`src/data/spirit-facts.json` | 200 | Sí | — |
| 4 | https://ntrs.nasa.gov/citations/20160001767 | `README.md`<br>`src/data/spirit-facts.json` | 200 | Sí | — |
| 5 | https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/ | `README.md`<br>`docs/ASSETS.md` | 200 | Sí | — |
| 6 | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ | `README.md`<br>`src/data/spirit-facts.json` | 200 | Sí | — |
| 7 | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/ | `README.md`<br>`src/data/spirit-facts.json` | 200 | Sí | — |
| 8 | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/ | `src/data/spirit-facts.json` | 200 | Sí | — |
| 9 | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-objectives/ | `src/data/spirit-facts.json` | 200 | Sí | — |
| 10 | https://science.nasa.gov/mission/mer-opportunity/ | `README.md`<br>`src/data/opportunityFacts.ts` | 200 | Sí | — |
| 11 | https://science.nasa.gov/mission/mer-spirit/ | `README.md`<br>`src/data/spirit-facts.json` | 200 | Sí | — |
| 12 | https://science.nasa.gov/resource/apollo-12-experiments-in-progress/ | `README.md`<br>`src/data/alsepFacts.ts` | 200 | Sí | — |
| 13 | https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf | `README.md`<br>`src/data/alsepFacts.ts` | 206 | Sí | — |
| 14 | https://www.jpl.nasa.gov/missions/mars-exploration-rover-spirit-mer-spirit/ | `src/data/spirit-facts.json` | 206 | Sí | — |
| 15 | https://www.jpl.nasa.gov/news/girl-with-dreams-names-mars-rovers-spirit-and-opportunity/ | `README.md`<br>`docs/ASSETS.md`<br>`src/data/spirit-facts.json`<br>`src/data/stories.ts` | 206 | Sí | — |
| 16 | https://www.jpl.nasa.gov/news/mars-rover-spirit-unearths-surprise-evidence-of-wetter-past/ | `src/data/spirit-facts.json` | 206 | Sí | — |
| 17 | https://www.jpl.nasa.gov/news/nasa-to-begin-attempts-to-free-sand-trapped-mars-rover/ | `src/data/spirit-facts.json` | 206 | Sí | — |
| 18 | https://www.jpl.nasa.gov/news/nasas-mars-rover-spirit-starts-a-new-chapter/ | `README.md`<br>`src/data/spirit-facts.json` | 206 | Sí | — |
| 19 | https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/ | `docs/ASSETS.md`<br>`src/data/opportunityFacts.ts` | 206 | Sí | — |
| 20 | https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/ | `README.md`<br>`src/data/spirit-facts.json` | 206 | Sí | — |
| 21 | https://www.nasa.gov/mission/apollo-12/ | `README.md`<br>`src/data/alsepFacts.ts` | 200 | Sí | — |
| 22 | https://www.nasa.gov/missions/mer/20-years-after-landing-how-nasas-twin-rovers-changed-mars-science/ | `src/data/spirit-facts.json` | 200 | Sí | — |
| 23 | https://www.nasa.gov/nasa-brand-center/images-and-media/ | `docs/ASSETS.md` | 200 | Sí | — |
| 24 | https://www.nasa.gov/podcasts/on-a-mission/rise-of-the-twins-spirit-and-opportunity-s4e3/ | `docs/ASSETS.md`<br>`src/data/stories.ts` | 200 | Sí | — |
| 25 | https://www.nasa.gov/wp-content/uploads/2023/01/NewsNotes-36-1-Spring-2019.pdf | `docs/ASSETS.md`<br>`src/data/opportunityFacts.ts` | 206 | Sí | — |
| 26 | https://www.nasa.gov/wp-content/uploads/2023/07/e3_rise_of_the_twins.mp3 | `docs/ASSETS.md`<br>`src/data/stories.ts` | 206 | Sí | — |

## Cambios de la auditoría del 15 nov 2026

Enlaces **quitados o sustituidos** (y por qué):

| Antes | Ahora | Motivo |
|---|---|---|
| `https://www.nasa.gov/wp-content/uploads/static/history/alsj/HamishALSEP.html` (Apollo Lunar Surface Journal, copia archivada) | Las 4 fuentes oficiales de Apollo 12 (abajo) | El equipo reportó imágenes rotas y aspecto poco confiable. Se reemplazó en los tres modos (Junior, Explorer, Discovery). |
| `https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo12info.html` | `https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C` | Fuente pedida por el equipo; la ficha 1969-099C describe el módulo lunar y el ALSEP de Apollo 12 con más detalle. |
| `https://ntrs.nasa.gov/citations/20180008613`, `https://ntrs.nasa.gov/citations/19790014808` | — (hechos retirados) | La Luna usa solo las 4 fuentes del equipo. Los hechos que dependían de estos informes (cinco estaciones, rescate de datos, fin del soporte) se retiraron de la app. |
| `https://www.nasa.gov/podcasts/on-a-mission/music-of-the-spheres/` | — (hechos retirados) | Ídem: los datos de los impactos (65 km, una hora; S-IVB de Apollo 13) se sustituyeron por el plan del dossier de prensa de Apollo 12. |
| `https://repository.hou.usra.edu/server/api/core/bitstreams/…/content` (comunicado NASA de 1977 en el archivo del LPI/USRA) | — (hechos retirados) | No es un dominio de la NASA y era un archivo sin página: aspecto poco confiable. |
| `https://pds-geosciences.wustl.edu/missions/mer/geo_mer_datasets.htm` (fuente secundaria del hecho «designations» de Spirit) | — (el hecho conserva sus fuentes NASA Science y NSSDCA) | No es dominio `nasa.gov` (nodo PDS alojado por la Universidad de Washington en St. Louis). |
| `https://visibleearth.nasa.gov/images/57752` (crédito de la textura Blue Marble) | `https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/` | La URL antigua ahora redirige a la portada de Earth Observatory; la nueva es la página oficial del Blue Marble 2002. |
| Inventario de fuentes de la investigación dentro del bundle (`data_sources`, `dead_or_broken_links`, `redirects` en `spirit-facts.json`, con enlaces a `athena.cornell.edu`, `an.rsl.wustl.edu`, `api.nasa.gov?api_key=DEMO_KEY`, etc.) | Quitado de la copia de la app | La app solo necesita `meta` + `facts`. El inventario completo sigue en el registro de investigación del equipo, fuera del repositorio de la app. |

Fuentes **oficiales de la Luna** (las 4 pedidas por el equipo, sin `?utm_source=chatgpt.com`):

1. https://www.nasa.gov/mission/apollo-12/ — misión Apollo 12 (tripulación y biografías → «Biografía adicional»).
2. https://science.nasa.gov/resource/apollo-12-experiments-in-progress/ — lanzamiento (14 nov 1969, plataforma 39-A, Saturn V), Intrepid y Yankee Clipper, Océano de las Tormentas, Surveyor 3, 34 kg de muestras, regreso el 24 nov 1969.
3. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C — alunizaje (19 nov 1969), estación central (25 kg), SNAP-27 (~70 W, plutonio-238), los 6 instrumentos, encendido (14:21 UT, 19 nov 1969) y apagado (30 sep 1977).
4. https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf — dossier de prensa (5 nov 1969): al menos un año de funcionamiento, sismómetro solar de Apollo 11, primer sistema eléctrico nuclear en la Luna, despliegue compatible con una red sísmica, impacto de calibración planificado (≈ una tonelada de TNT, ≈ 5 millas náuticas).

**Biografías y lecturas secundarias:** el ensayo de Sofi Collis (JPL) y las biografías de Conrad, Bean y Gordon (nasa.gov) se muestran plegados en «Biografía adicional», separados de los hechos principales de cada parada.
