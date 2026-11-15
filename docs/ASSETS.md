# Inventario de recursos visuales y sonoros / Asset inventory

Última revisión: 15 nov 2026. **No hay imágenes generadas con IA en la app.** Si en el futuro se añade alguna, debe llevar el rótulo visible «Imagen generada con IA» (mecanismo `aiGenerated: true` ya disponible en las tarjetas) y entrar en esta tabla.

## Recursos externos (de terceros)

| Recurso | Dónde se usa | Origen | Licencia / condiciones | ¿Se aloja en ECOS? |
|---|---|---|---|---|
| *Blue Marble* (textura de la Tierra) | Mis logros (órbita) | NASA Earth Observatory / GSFC, *Blue Marble: Land Surface, Shallow Water, and Shaded Topography* (2002, Visible Earth id 57752) — https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/ (la antigua URL de Visible Earth ahora redirige a la portada de Earth Observatory) | Dominio público (NASA). Crédito: NASA. | Sí (`src/achievements/assets/earth-blue-marble-2048.jpg`) |
| Audio de Sofi Collis leyendo su ensayo | Ruta de Spirit y de Opportunity, parada «Un nombre» (`SofiPlayer.tsx`) | Podcast NASA/JPL «On a Mission», T4 E3 «Rise of the Twins: Spirit and Opportunity» (16 feb 2022). Página: https://www.nasa.gov/podcasts/on-a-mission/rise-of-the-twins-spirit-and-opportunity-s4e3/ · MP3: https://www.nasa.gov/wp-content/uploads/2023/07/e3_rise_of_the_twins.mp3 (fragmento 3:48–4:13) | Guía de uso de medios de la NASA (https://www.nasa.gov/nasa-brand-center/images-and-media/): en general sin copyright, uso educativo con atribución, sin implicar respaldo; si aparece una persona identificable, el uso comercial puede requerir permiso. Uso en ECOS: educativo, no comercial, con crédito y enlace. | **No.** Se reproduce en streaming desde nasa.gov (sin `autoplay`, `preload="none"`). Si falla, se muestra enlace a la página oficial. Nunca se sintetiza ni imita su voz. |
| Texto del ensayo de Sofi (inglés) | Reproductor «Leer el ensayo» | JPL: https://www.jpl.nasa.gov/news/girl-with-dreams-names-mars-rovers-spirit-and-opportunity/ | Cita textual con crédito y enlace | Texto citado |
| «I'll Be Seeing You» (última canción enviada a Opportunity) | Ruta de Opportunity, parada «Última canción» — sólo como **hecho con enlace** | Dato: NASA History Division, *News & Notes* vol. 36 n.º 1 (2019) https://www.nasa.gov/wp-content/uploads/2023/01/NewsNotes-36-1-Spring-2019.pdf · últimos comandos: https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/ | La canción y sus grabaciones tienen derechos de autor | **No.** No se reproduce, incrusta, aloja ni cita su letra. En su lugar suena (si el sonido está activado) un ambiente procedural propio. |
| Traducción al español del ensayo | Reproductor | Traducción del equipo The Last Neuron, **rotulada «no oficial»** | Del equipo | Sí |

## Recursos propios dibujados por código (no son fotos, no son IA)

| Recurso | Archivo |
|---|---|
| Logo ECOS (órbita dorada en la O) | `src/achievements/components/EcosLogo.tsx` |
| Planetas del universo (shader WebGL, SVG Junior, CSS sin WebGL) | `src/prologue/universe/PlanetRenderer.ts`, `JuniorArt.tsx`, `universe.css` |
| Superficies de Marte y la Luna (3 estilos) | `MarsSurface.tsx`, `MoonSurface.tsx` |
| Glifos de rover y estación ALSEP | `JuniorArt.tsx` (`RoverGlyph`), `MoonSurface.tsx` (`AlsepGlyph`) |
| Señales futuras con candado | `ArtifactsScreen.tsx` + `universe.css` (`.sig--future`) |
| Camino 3D de las rutas (Canvas 2D: cielo, montañas en paralaje, balizas, decorados por parada) | `story/RouteScene.ts` |
| Escenas de actividades (rover para armar, mapa de Marte, ruta, estación, red sísmica, escena del equipo abandonado) | `story/activities.tsx` |
| Iconos de parada | `story/StopIcon.tsx` |
| Cielo, Tierra, nubes y Vía Láctea de Mis logros | `src/achievements/sky/*` |
| Superposiciones de viaje por modo | `universe/TravelFx.tsx` |
| Capa cinematográfica Discovery (grano SVG feTurbulence, viñeta, etalonaje, letterbox) | `universe/CineFx.tsx`, `universe.css` |
| Salida de la Tierra (Earthrise) | `MoonSurface.tsx` (`.earthrise`), `story/RouteScene.ts` |
| Bokeh, profundidad de campo y textura de regolito (ruido generado en tiempo de ejecución) | `story/RouteScene.ts` (`cine`, `noisePattern`) |
| Sismógrafo ilustrativo y transmisión a Marte | `story/activities.tsx` (`Quake`, `Song`) |
| Pantalla «Top exploradores» | `src/app/RankingScreen.tsx`, `ranking.css` |

Todas las posiciones, tamaños y distancias de mapas y escenas son **artísticas, no a escala** (se indica en pantalla).

## Sonido

Todo el sonido de la interfaz es **síntesis procedural Web Audio** (`src/prologue/audio/soundEngine.ts`): sin archivos, sin IA, apagado por defecto. Incluye el ambiente de despedida de Opportunity (`farewell`, dos acordes suaves) y el rumor del sismo lunar (`moonquake`, ruido filtrado + seno grave); no imitan ninguna canción ni grabación. La única grabación es el audio oficial de la NASA descrito arriba, que no se aloja.

## Lo que NO se usa

- Logos, banderas, insignias o «meatball» de la NASA.
- Fotos de la NASA (no se incluyó ninguna; se podrían añadir con crédito, p. ej. las del equipo abandonado de Opportunity, verificando cada imagen).
- Imágenes, voces o música generadas con IA.
