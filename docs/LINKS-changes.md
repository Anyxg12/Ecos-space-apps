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
