# Changelog

## [1.0.0 · Prototipo final] — 15 nov 2026

Ronda de pulido a partir del PDF de revisión del equipo.

### Corregido
- **Navegación de las rutas (bug del PDF: «paso a la siguiente y me regresa a la anterior»).** Reproducido con Playwright: si el usuario hacía scroll con la rueda o el touchpad para leer la tarjeta mientras la cámara viajaba, la tarjeta estaba oculta y la rueda caía sobre el paisaje, que interpretaba «subir» como «volver a la parada anterior». Además, un arrastre que terminaba fuera del paisaje quedaba «vivo» y movía la ruta al mover el ratón sin pulsar. Ahora: la rueda se ignora sobre el área de la tarjeta y mientras la cámara se mueve; el arrastre usa captura de puntero y se cancela al soltar o al navegar con botones. Prueba de regresión `ONLY=nav` en `scripts/qa.mjs` (falla con el código anterior y pasa con el nuevo en los tres modos).
- **Cohete de «Despegue» (Spirit y Opportunity).** Antes subía 140 px y se quedaba encima del título de la tarjeta. Ahora, al completar la actividad, sale de la tarjeta y vuela hasta salir por arriba de la pantalla con estela (color por modo), tiembla mientras se carga y deja humo y una estela en la plataforma. Con movimiento reducido no vuela: se desvanece.

### Cambiado
- **Fuentes de la Luna (los tres modos).** ALSEP usa solo las cuatro fuentes oficiales elegidas por el equipo: misión Apollo 12 (nasa.gov), «Apollo 12 Experiments in Progress» (science.nasa.gov), ficha NSSDCA 1969-099C y dossier de prensa de Apollo 12 (PDF). Se quitó la página archivada del Apollo Lunar Surface Journal (imágenes rotas) y el comunicado alojado en un repositorio externo. Cada hecho se volvió a comprobar contra esas fuentes; los que no estaban en ellas se retiraron (red de 4 sismómetros, 29 años, señal portadora, rescate de datos, impacto del S-IVB de Apollo 13).
- **Ruta ALSEP reescrita sobre Apollo 12:** «Conecta los instrumentos» (6 instrumentos a la estación central, nueva variante de la actividad de red), «Sismo de calibración» (el plan del dossier: etapa de ascenso, ≈ 9 km, ≈ 1 t de TNT), apagado de los 6 instrumentos (encendido 19 nov 1969 → apagado 30 sep 1977). La ficha de la Luna lista sus 4 fuentes oficiales.
- **«Biografía adicional» / «Lectura adicional»:** el material secundario (ensayo de Sofi Collis; biografías de Conrad, Bean y Gordon) se muestra plegado y separado de los hechos principales, en la ruta, en la vista de lista y en las fichas.
- **Auditoría de todos los enlaces** (`scripts/check-links.mjs` → `docs/LINKS.md`): 26 enlaces, todos `nasa.gov` y con respuesta correcta. Se quitó un enlace no NASA (PDS Geosciences en wustl.edu), se actualizó el crédito del Blue Marble (la URL de Visible Earth ahora redirige a una portada) y la copia de `spirit-facts.json` de la app quedó solo con `meta` + `facts` (sin el inventario de investigación ni enlaces de terceros).
- Botón del paso de intereses: «Abrir mi universo» → **«Explorar lo desconocido»** (todos los modos).
- **Sonido más fuerte:** ganancia maestra 0,8 → 2 (≈ 2,5×), refuerzo ×1,6 de los microefectos cortos, compresor más suave y limitador a −3 dBFS para evitar picos. El ambiente sube menos que los efectos. Sigue apagado por defecto.

### Repositorio
- Listo para GitHub: `.gitignore` completo, flujo de GitHub Pages (`.github/workflows/deploy.yml`), README bilingüe con despliegue (GitHub Pages / Vercel / estático), metadatos Open Graph, `docs/LINKS.md`, declaración de IA ampliada (código, pruebas y documentación).

## [Ronda 4] — 14–15 nov 2026

### Añadido
- **Opportunity · «Última canción»** (parada 8, capítulo «Despedida»): actividad «Enviar la última transmisión» (pulso Tierra/Goldstone → Marte, «No hubo respuesta») con un ambiente procedural suave (`sound.farewell`, sólo si el sonido está activado). Hechos verificados con fuente: últimos comandos del 12 feb 2019 desde la antena de 70 m de Goldstone (JPL) y la última canción, «I'll Be Seeing You», popularizada en 1944 por Bing Crosby y luego Billie Holiday (NASA History Division, *News & Notes* 36-1). **La grabación no se reproduce, no se incrusta ni se aloja** (tiene derechos de autor); sólo se enlaza la fuente oficial. No se citan letras ni la frase «my battery is low…» (fue una traducción libre de un periodista/ingeniero, no palabras del rover).
- **ALSEP · «¡La Luna tiembla!»** (nueva parada antes del apagado): actividad «sismo provocado» con sismógrafo animado (crecimiento y decaimiento lento, eje «0 … ~1 hora») rotulada **ilustrativa**, rumor procedural (`sound.moonquake`). Hechos: impacto del módulo lunar del Apolo 12 (~65 km, equivalente a 1 t de TNT, ondas durante una hora) y de la etapa S-IVB del Apolo 13 (~137 km, 11,5 t de TNT, casi 3,5 h) — fuente: podcast NASA «On a Mission: Music of the Spheres».
- **Llegada lunar cinematográfica:** salida de la Tierra (Earthrise) animada en la superficie lunar de los tres modos y en la ruta ALSEP; Tierra con atmósfera y nubes en Discovery.
- **Discovery más cinematográfico y realista:** capa de grano de película, viñeta y etalonaje documental (`CineFx`, sólo CSS/SVG); bandas de cine (letterbox) que se retiran al llegar a una superficie y al entrar a una ruta; deriva lenta de cámara en la superficie; en la ruta, montañas lejanas desenfocadas (profundidad de campo), polvo desenfocado (bokeh), textura de regolito que se desplaza con la cámara, luz rasante y cráteres con sombra. Todo se desactiva/queda estático con movimiento reducido; sin WebGL sigue funcionando.
- **«Top exploradores»** (pantalla nueva, temática por modo): accesible desde la cabecera del universo, desde Mis logros (botón inferior derecho) y desde el perfil. Muestra **tu posición calculada con tus estrellas reales** de este dispositivo dentro de una tabla rotulada **«Datos de demostración»** (seudónimos ficticios marcados «demo»), podio, barra de progreso y nota «Ranking global — Pendiente» (necesita servidor/Supabase). `?view=ranking` abre la pantalla directamente.
- **Clave secreta local** en el perfil: seudónimo + clave; sólo se guarda una sal aleatoria y un hash **PBKDF2-SHA-256** (Web Crypto, 150 000 iteraciones) en `ecos.secret.v1`; bloquear/desbloquear el perfil en este dispositivo, cambiar o quitar la clave (el progreso no se toca). Se indica claramente: sólo este dispositivo, sin recuperación; recuperación y otros dispositivos llegarán con Supabase (Pendiente).
- **Repositorios:** `ProfileRepository` + `LocalProfileRepository` (`src/app/repositories/index.ts`) y stubs `SupabaseProfileRepository`/`SupabaseProgressRepository` (`src/app/repositories/supabase.ts`) con TODO; sin conexión ni credenciales.

### Cambiado
- Decorados de las rutas redibujados y más grandes (×1,25), por modo: estación central ALSEP con parasol y antena, RTG con aletas, sismómetro sobre manta térmica, módulo lunar, rover, paracaídas + escudo térmico + carcasa, cohete Delta con torre, antena DSN. Nunca quedan cortados por el borde izquierdo.
- Sólo se dibujan los decorados cercanos y sólo se rotulan la baliza activa y la siguiente (ya no se amontonan iconos en el horizonte).
- Cráteres de Explorer: anillos de alambre en vez de manchas violetas sólidas.
- Diálogo final de ruta: rejilla con el botón principal a todo el ancho y dos botones iguales sin cortes («Repetir ruta» ya no se corta ni se parte en Explorer).
- Móvil: la fila de paradas pasa arriba (ya no tapa la baliza), los botones del diálogo final se apilan en ≤480 px y los rótulos de balizas nunca se salen por los bordes.
- Efectos de Discovery optimizados (sin `mix-blend-mode` ni filtros de desenfoque por fotograma): en la misma máquina de pruebas la ruta pasó de ~1,7 a ~3,7 fps con GPU por software (no es una medida de GPU real).
- El ranking del perfil ahora cuenta las estrellas de Opportunity (antes sólo Spirit y ALSEP) y enlaza a «Top exploradores».


## [Ronda 3] — 14 nov 2026

### Añadido
- **Tres historias completas con el mismo motor de ruta interactiva:** Spirit (Marte, misión principal), **Opportunity** (Marte) y **ALSEP** (Luna).
- **Ruta 3D (Canvas 2D, sin WebGL):** cámara que avanza por un camino con profundidad, paralaje de montañas, balizas por parada, decorados por capítulo y orbe guía. Se controla con rueda, arrastre, ←/→, RePág/AvPág, toque en balizas o pips. Panel corto por parada (título + una frase + actividad + hechos plegables con fuente).
- **Orden de la historia de los rovers:** construcción → despegue → nombre (Sofi Collis, 9 años) → aterrizaje → exploración → última señal → legado.
- **Audio oficial de Sofi Collis** (podcast NASA/JPL «On a Mission», fragmento 3:48–4:13), en streaming desde nasa.gov, sin alojar copia; ensayo original + traducción no oficial.
- **Actividades** (no simulaciones): armar el rover, mantener pulsado para despegar, elegir el lugar de aterrizaje (con pista si fallas y contador de rebotes), arrastrar el rover por su ruta, encontrar el equipo abandonado (Opportunity), colocar la estación ALSEP, conectar la red sísmica, apagar las estaciones.
- **Vista de lista** accesible de cada ruta (todo el contenido sin animación).
- Logros nuevos sin romper los existentes: `opportunity-historia`, `opportunity-actividad`, `opportunity-legado` (insignia «Huellas de Opportunity», provisional), `alsep-historia`, `alsep-actividad`, `alsep-legado` (insignia «Ecos de la Luna», provisional). `marte-todos` sigue bloqueada como meta futura. Mis logros: «x de 11».
- **Señales futuras** en Marte (3) y la Luna (3): icono tenue con candado, etiqueta accesible «Señal futura: artefacto por descubrir». Sin nombres de misiones ni «Próximamente».
- **Viaje universo → mundo distinto por modo** (Junior «¡Rumbo a…!», Explorer HUD de salto, Discovery letterbox), botón «Saltar transición», nota «no a escala».
- **Perfil local editable:** seudónimo, edad e intereses; aviso de pérdida al borrar datos; «Clave de recuperación — Pendiente»; ranking rotulado «Datos de demostración».
- `?gl=0` fuerza el universo sin WebGL.

### Cambiado
- La Luna ya no es decorativa: tiene la ruta ALSEP con hechos NASA verificados.
- Opportunity pasa de ficha a historia completa (la ficha sigue disponible en el dock).
- Sonidos por parada, deslizamiento, acierto/error, rebotes y apagado (procedurales, apagados por defecto).

### Corregido
- La capa de señales tapaba el botón «Volver» de la superficie (no se podía pulsar con ratón).
- El universo de fondo seguía accesible por teclado detrás de la superficie y del perfil (ahora `inert`).
- Cabecera móvil desbordada (botones secundarios movidos al perfil).

## [Ronda 2] y anteriores
- Prólogo cinematográfico, universo de tres modos, Mis logros con despegue cinematográfico, sonido procedural, ficha de Spirit/Opportunity, sincronización entre pestañas.
