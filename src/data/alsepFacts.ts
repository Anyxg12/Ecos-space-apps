import type { RoverFact } from './opportunityFacts';

/**
 * Hechos verificados de ALSEP (Apollo Lunar Surface Experiments Package) en Apollo 12.
 * Fuentes oficiales de la NASA (revisadas el 15 de noviembre de 2026). Son las cuatro que pidió el equipo
 * para la Luna en los tres modos. Si un dato no está en ellas, la app no lo muestra.
 *  - NASA · misión Apollo 12 ............ https://www.nasa.gov/mission/apollo-12/
 *  - NASA Science · foto y descripción ... https://science.nasa.gov/resource/apollo-12-experiments-in-progress/
 *  - NASA NSSDCA · Apollo 12 LM / ALSEP .. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C
 *  - NASA · dossier de prensa (1969) ..... https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf
 * Nota: el dossier de prensa se publicó antes del vuelo (5 nov 1969); lo que describe se presenta como «el plan».
 */
export const MOON_SOURCES = {
  mission: { publisher: 'NASA · misión Apollo 12', url: 'https://www.nasa.gov/mission/apollo-12/' },
  resource: { publisher: 'NASA Science · «Apollo 12 Experiments in Progress»', url: 'https://science.nasa.gov/resource/apollo-12-experiments-in-progress/' },
  nssdc: { publisher: 'NASA NSSDCA · Apollo 12 LM / ALSEP', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C' },
  presskit: { publisher: 'NASA · dossier de prensa de Apollo 12 (1969, PDF)', url: 'https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf' },
} as const;
const S = MOON_SOURCES;

export const ALSEP_FACTS = {
  que_es: {
    id: 'que_es',
    label: 'Qué era ALSEP',
    value: 'Un conjunto de instrumentos científicos que los astronautas colocaban en el sitio de aterrizaje y dejaban en la superficie de la Luna.',
    source: S.nssdc,
  },
  un_ano: {
    id: 'un_ano',
    label: 'Para al menos un año',
    value: 'El plan: el paquete quedaría en la superficie enviando datos científicos y de ingeniería a la Tierra durante al menos un año.',
    source: S.presskit,
  },
  a11_solar: {
    id: 'a11_solar',
    label: 'El sismómetro de Apollo 11',
    value: 'Usaba energía solar, así que solo funcionaba durante el día lunar. Tenía su propia electrónica y su propio transmisor.',
    source: S.presskit,
  },
  a12_nuclear: {
    id: 'a12_nuclear',
    label: 'El cambio en Apollo 12',
    value: 'El sismómetro de Apollo 12 usaba energía nuclear y podía funcionar sin parar. Enviaba sus lecturas a la estación central, que las mandaba a la Tierra.',
    source: S.presskit,
  },
  apollo12: {
    id: 'apollo12',
    label: 'Apollo 12',
    value: 'El módulo lunar Intrepid alunizó el 19 de noviembre de 1969 en el Océano de las Tormentas (Oceanus Procellarum), a unos 180 m de la sonda Surveyor 3. Bajaron Charles «Pete» Conrad y Alan L. Bean.',
    source: S.nssdc,
  },
  viaje: {
    id: 'viaje',
    label: 'El viaje',
    value: 'Despegó el 14 de noviembre de 1969 desde la plataforma 39-A del Centro Espacial Kennedy en un Saturn V. Richard Gordon quedó en órbita con el módulo de mando Yankee Clipper. Volvió a la Tierra el 24 de noviembre de 1969.',
    source: S.resource,
  },
  estacion_central: {
    id: 'estacion_central',
    label: 'La estación central',
    value: 'Una caja de 25 kg que daba energía y comunicaciones a los instrumentos. Los astronautas apuntaban su antena hacia la Tierra, y la estación se controlaba con comandos enviados desde aquí.',
    source: S.nssdc,
  },
  energia: {
    id: 'energia',
    label: 'Energía',
    value: 'Un generador de radioisótopos SNAP-27 (RTG) con plutonio-238 producía unos 70 vatios. La electricidad llegaba por un cable a la estación central.',
    source: S.nssdc,
  },
  primera_nuclear: {
    id: 'primera_nuclear',
    label: 'Una primera vez',
    value: 'Según el dossier de prensa, el SNAP-27 de Apollo 12 sería el primer uso de un sistema de energía eléctrica nuclear en la Luna.',
    source: S.presskit,
  },
  a12_instrumentos: {
    id: 'a12_instrumentos',
    label: 'Seis instrumentos',
    value: 'Sismómetro pasivo, detector de iones supratérmicos, medidor de iones de cátodo frío (atmósfera), detector de polvo lunar, magnetómetro de superficie y espectrómetro de viento solar. Todos conectados por cables a la estación central.',
    source: S.nssdc,
  },
  red_sismica: {
    id: 'red_sismica',
    label: 'Pensado para una red',
    value: 'Uno de los objetivos de Apollo 12 era desplegar el ALSEP de forma compatible con una red sísmica.',
    source: S.presskit,
  },
  objetivos: {
    id: 'objetivos',
    label: 'Qué querían saber',
    value: 'Los experimentos buscaban conocer la estructura y el estado del interior de la Luna, la composición de su superficie y los procesos que la cambiaron.',
    source: S.presskit,
  },
  impacto_plan: {
    id: 'impacto_plan',
    label: 'Un sismo a propósito',
    value: 'El plan: tras volver al módulo de mando, lanzar la etapa de ascenso del módulo lunar contra la Luna, a unas 5 millas náuticas (unos 9 km) del sismómetro. Sería un sismo de calibración equivalente a una tonelada de TNT.',
    source: S.presskit,
  },
  encendido: {
    id: 'encendido',
    label: 'Encendido',
    value: 'La estación central de Apollo 12 se encendió a las 14:21 UT del 19 de noviembre de 1969.',
    source: S.nssdc,
  },
  apagado: {
    id: 'apagado',
    label: 'Apagado',
    value: 'Se apagó el 30 de septiembre de 1977, junto con las demás estaciones ALSEP: casi ocho años después de encenderse.',
    source: S.nssdc,
  },
  siguen_alli: {
    id: 'siguen_alli',
    label: 'Sigue en la Luna',
    value: 'Los instrumentos se desplegaron para quedarse en la superficie. La estación central está registrada en 3,0094° S y 23,4246° O, en el Océano de las Tormentas.',
    source: S.nssdc,
  },
  muestras: {
    id: 'muestras',
    label: 'Lo que sí volvió',
    value: 'Los astronautas trajeron 34 kg (75 libras) de rocas lunares; además encontraron la sonda robótica Surveyor 3, que había llegado a la Luna en 1967.',
    source: S.resource,
  },
  /* ── Biografía adicional (tripulación) · NASA, página oficial de la misión ── */
  bio_conrad: {
    id: 'bio_conrad',
    label: 'Charles «Pete» Conrad Jr.',
    value: 'Seleccionado como astronauta en septiembre de 1962. Voló en Gemini V, fue comandante de Gemini XI y de Apollo 12, y en su última misión comandó Skylab II, la primera estación espacial de Estados Unidos.',
    source: S.mission,
    extra: 'bio',
  },
  bio_bean: {
    id: 'bio_bean',
    label: 'Alan L. Bean',
    value: 'Del tercer grupo de astronautas de la NASA (octubre de 1963). Sumó 1671 horas y 45 minutos en el espacio, 10 h 26 min de ellas en actividades extravehiculares en la Luna y en órbita terrestre.',
    source: S.mission,
    extra: 'bio',
  },
  bio_gordon: {
    id: 'bio_gordon',
    label: 'Richard F. Gordon Jr.',
    value: 'Del tercer grupo de astronautas de la NASA (octubre de 1963). Completó dos vuelos espaciales con 315 horas y 53 minutos en el espacio. Se retiró de la NASA en enero de 1972.',
    source: S.mission,
    extra: 'bio',
  },
} satisfies Record<string, RoverFact>;

export type AlsepFactId = keyof typeof ALSEP_FACTS;
export const alsepFact = (id: AlsepFactId): RoverFact => ALSEP_FACTS[id];
export const ALSEP_CREW_BIOS: RoverFact[] = [ALSEP_FACTS.bio_conrad, ALSEP_FACTS.bio_bean, ALSEP_FACTS.bio_gordon];
