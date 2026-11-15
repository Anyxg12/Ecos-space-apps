# Provisional / pendiente / no funciona todavía

Estado al 15 nov 2026. Lo que aparece aquí **no** debe presentarse como terminado.

## Contenido provisional (rotulado en la app)
- Toda la narración de las tres rutas (Spirit, Opportunity, ALSEP): frases cortas que reformulan los hechos verificados. Rótulo «Contenido provisional» visible en cada ruta. El equipo debe revisar el tono y la exactitud.
- Traducción al español del ensayo de Sofi Collis: del equipo The Last Neuron, rotulada «no oficial».
- Insignias «Huellas de Spirit», «Huellas de Opportunity» y «Ecos de la Luna»: diseño provisional.
- «Top exploradores»: con backend muestra el ranking real («● En vivo», sólo seudónimo y estrellas, desde Supabase). Si el backend no responde, vuelve a la tabla rotulada «Datos de demostración» (seudónimos ficticios marcados «(demo)»).
- Sismógrafo de la parada «¡La Luna tiembla!»: forma de onda y sonido **ilustrativos** (no son datos reales del sismómetro). El texto describe el **plan** del dossier de prensa de Apollo 12 (1969): impacto de la etapa de ascenso a unas 5 millas náuticas, equivalente a una tonelada de TNT.
- Transmisión de la parada «Última canción»: animación ilustrativa; la canción real no se reproduce.
- Disposición de los seis instrumentos alrededor de la estación central en la actividad «Conecta los instrumentos» (ALSEP), de los sitios en el mini-mapa de Marte y de las piezas en la escena del equipo abandonado: **ilustrativas, no a escala** (indicado en pantalla).

## No implementado (fuera de alcance de este MVP)
- Clave secreta: **sólo local** (hash PBKDF2-SHA-256 con sal en este navegador). No hay recuperación si se olvida; se puede quitar la clave sin perder progreso. Cualquiera con acceso al dispositivo podría borrar los datos del navegador: es una protección ligera, no una cuenta.
- Clave de recuperación / acceso entre dispositivos: pendiente. La cuenta de Supabase es anónima y vive en este navegador; si se borran sus datos, se pierde el acceso a ese progreso.
- Chat con IA (no existe; la IA sólo genera la analogía corta bajo cada hecho verificado). Backend implementado el 15 nov 2026: ver `docs/BACKEND.md`.
- Señales futuras en Marte y la Luna: son marcadores visuales bloqueados; no abren nada ni nombran misiones.
- «Todos los artefactos de Marte»: meta futura bloqueada; no se puede conseguir.

## Fuentes de la Luna (cambio del 15 nov 2026)
- La ruta ALSEP y la ficha de la Luna usan **solo** las cuatro fuentes oficiales elegidas por el equipo: página de la misión Apollo 12 (nasa.gov), recurso «Apollo 12 Experiments in Progress» (science.nasa.gov), ficha NSSDCA 1969-099C y dossier de prensa de Apollo 12 (PDF, science.nasa.gov). Los hechos que no estaban en ellas (red de cuatro sismómetros, 29 años de funcionamiento, señal portadora tras el apagado, rescate de datos, impacto del S-IVB de Apollo 13) **se quitaron**. Si el equipo quiere recuperarlos, debe añadir una fuente oficial que los respalde.
- Las biografías de la tripulación (Conrad, Bean, Gordon) y el ensayo de Sofi Collis se muestran plegados en «Biografía adicional», separados de los hechos principales.

## Riesgos / a revisar por el equipo
- **Audio de Sofi:** depende de que nasa.gov siga sirviendo el MP3 en la misma URL. Si falla, el reproductor muestra un enlace a la página del episodio (minuto 3:48). Si el equipo prefiere no depender del servidor, debe aportar el archivo y su fuente (no se ha descargado ni re-alojado).
- La guía de medios de la NASA indica que, si aparece una persona identificable, el uso comercial puede requerir permiso; el uso de ECOS es educativo y no comercial. La misma guía incluye un apartado sobre aplicaciones de IA que prohíbe atribuir a la NASA contenido generado con IA: ningún texto de ECOS debe presentarse como escrito o avalado por la NASA.
- El récord de distancia de Opportunity «hasta que Perseverance lo superó el 11 de octubre de 2026» viene de la página de NASA Science consultada el 14 nov 2026; conviene revisarlo antes de presentar.

- La última canción: NASA History la describe como «popularized in 1944 by Bing Crosby and then Billie Holiday»; NPR y otros medios dicen que se envió la versión de Billie Holiday. En ECOS se usa la redacción de NASA (no se afirma qué versión).

## No probado
- Analogías con IA (Gemini): se probaron en vivo, pero el texto es generado y puede variar; el hecho verificado de la NASA siempre se muestra aparte y la IA no puede añadir cifras nuevas.
- Volumen real de los efectos de sonido (se subió ~2,5× con compresor y limitador, pero nadie lo ha escuchado en el entorno de pruebas).
- GPU reales (fps), Safari, Firefox, móviles físicos, lectores de pantalla reales, sonido escuchado por una persona, reproducción real del audio de nasa.gov en el navegador de pruebas (el entorno de QA no reproduce audio; sí se verificó que la URL responde y admite rangos).
