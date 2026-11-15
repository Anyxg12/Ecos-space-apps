import type { AgeGroup } from '../prologue/state/types';
import type { PlaceId } from '../prologue/state/destinations';
import type { RoverFact } from './opportunityFacts';
import { fact } from './spiritFacts';
import { alsepFact as af, ALSEP_CREW_BIOS } from './alsepFacts';
import { OPP_FACTS as op } from './opportunityFacts';

/**
 * Rutas narrativas interactivas (Spirit y Opportunity en Marte, ALSEP en la Luna). Mismo motor, tres tonos.
 * Reglas:
 *  - La narración (rotulada «Contenido provisional») sólo reformula hechos verificados del proyecto.
 *  - Cada hecho se muestra con su fuente enlazada. Sin diálogos, citas, fechas ni decisiones inventadas.
 *  - Las actividades son juegos sencillos para recordar los hechos. No son simulaciones científicas.
 */
export type ByMode = Record<AgeGroup, string>;
export type StopIcon = 'build' | 'rocket' | 'name' | 'landing' | 'route' | 'signal' | 'station' | 'seismo' | 'module' | 'power' | 'quake' | 'off' | 'debris' | 'song';

export type Activity =
  | { kind: 'reveal' }
  | { kind: 'assemble'; target: 'rover'; parts: { id: string; label: string; fact: RoverFact }[] }
  | { kind: 'hold'; label: string }
  | { kind: 'audio' }
  | { kind: 'choice'; prompt: ByMode; options: { id: string; label: string; correct: boolean; feedback: string }[]; bounce?: number; bounceMin?: boolean }
  | { kind: 'route'; waypoints: { id: string; label: string; fact: RoverFact }[] }
  | { kind: 'place'; items: { id: string; label: string; slot: 'center' | 'side' | 'ring'; fact: RoverFact }[] }
  | { kind: 'network'; hub?: string; sites: { id: string; label: string; x: number; y: number }[] }
  | { kind: 'switch'; stations: string[] }
  | { kind: 'song' }
  | { kind: 'quake' }
  | { kind: 'find'; items: { id: string; label: string; x: number; y: number; fact?: RoverFact }[] };

export interface StoryStop {
  id: string;
  icon: StopIcon;
  chapter: string;
  title: ByMode;
  /** una sola frase corta por modo */
  line: ByMode;
  facts: RoverFact[];
  activity: Activity;
  /** ¿hay que completar la actividad para continuar? (sólo las de respuesta correcta) */
  gate?: boolean;
  /** estrella que se enciende al superar esta parada */
  star?: string;
}
export interface Story {
  id: 'spirit' | 'opportunity' | 'alsep';
  place: PlaceId;
  name: string;
  routeTitle: ByMode;
  backLabel: ByMode;
  stops: StoryStop[];
  legacy: { title: ByMode; line: ByMode; facts: RoverFact[]; star: string; badge: string; completeLabel: string; doneTitle: string };
}

const sf = (id: string): RoverFact => {
  const f = fact(id);
  return { id, label: f.label_es, value: f.value_es, source: { publisher: f.sources[0].publisher, url: f.sources[0].url } };
};

/** Ensayo de Sofi Collis (texto original publicado por JPL). */
export const SOFI_ESSAY: RoverFact = {
  id: 'sofi_essay',
  label: 'Sofi Collis y su ensayo ganador',
  extra: 'bio',
  value:
    '“I used to live in an orphanage. It was dark and cold and lonely. At night, I looked up at the sparkly sky and felt better. I dreamed I could fly there. In America, I can make all my dreams come true. Thank you for the ‘Spirit’ and the ‘Opportunity.’” Elegido entre casi 10 000 ensayos; Sofi nombró a los dos rovers gemelos.',
  source: { publisher: 'NASA Jet Propulsion Laboratory', url: 'https://www.jpl.nasa.gov/news/girl-with-dreams-names-mars-rovers-spirit-and-opportunity/' },
};
/** Traducción del equipo ECOS (no oficial). */
export const SOFI_ESSAY_ES =
  '«Antes vivía en un orfanato. Era oscuro, frío y solitario. De noche miraba el cielo brillante y me sentía mejor. Soñaba que podía volar hasta allí. En Estados Unidos puedo hacer realidad todos mis sueños. Gracias por el “Spirit” (espíritu) y la “Opportunity” (oportunidad).»';

/** Fragmento oficial del podcast de NASA/JPL donde Sofi lee su ensayo (se reproduce desde nasa.gov, no se aloja). */
export const SOFI_AUDIO = {
  src: 'https://www.nasa.gov/wp-content/uploads/2023/07/e3_rise_of_the_twins.mp3',
  start: 228.4,
  end: 252.8,
  page: 'https://www.nasa.gov/podcasts/on-a-mission/rise-of-the-twins-spirit-and-opportunity-s4e3/',
  credit: 'Audio: NASA/JPL · podcast «On a Mission», T4 E3 «Rise of the Twins: Spirit and Opportunity» (2022), fragmento 3:48–4:13.',
};

export const SPIRIT_STORY: Story = {
  id: 'spirit',
  place: 'marte',
  name: 'Spirit',
  routeTitle: { junior: 'El viaje de Spirit', explorer: 'RUTA // SPIRIT · MER-A', discovery: 'Spirit, una travesía por Marte' },
  backLabel: { junior: 'Volver a Marte', explorer: 'Volver a superficie', discovery: 'Volver a Marte' },
  stops: [
    {
      id: 'construccion',
      icon: 'build',
      chapter: 'Antes del viaje',
      title: { junior: '¡Armemos a Spirit!', explorer: 'Ensamblaje', discovery: 'Un geólogo robot' },
      line: {
        junior: 'Spirit es un robot geólogo de unos 185 kg. Ponle sus piezas.',
        explorer: 'Rover MER-A · 185 kg · carga científica Athena. Completa el ensamblaje.',
        discovery: 'Construido por NASA/JPL, Spirit llevaba un laboratorio de geología: el paquete Athena.',
      },
      facts: [sf('management'), sf('mass_rover')],
      activity: {
        kind: 'assemble',
        target: 'rover',
        parts: [
          { id: 'mastil', label: 'Mástil con Pancam', fact: sf('instrument_pancam') },
          { id: 'brazo', label: 'Brazo con instrumentos', fact: sf('athena_payload') },
          { id: 'rat', label: 'Herramienta RAT', fact: sf('instrument_rat') },
        ],
      },
    },
    {
      id: 'despegue',
      icon: 'rocket',
      chapter: 'Antes del viaje',
      title: { junior: '¡Despegue!', explorer: 'Lanzamiento', discovery: 'La partida' },
      line: {
        junior: 'Mantén pulsado el botón para despegar.',
        explorer: 'Delta II · Cabo Cañaveral. Mantén pulsado para iniciar el lanzamiento.',
        discovery: 'Junio de 2003: un cohete Delta II lo lanzó desde Cabo Cañaveral.',
      },
      facts: [sf('launch_datetime'), sf('launch_vehicle_site')],
      activity: { kind: 'hold', label: 'Mantén pulsado para despegar' },
    },
    {
      id: 'nombre',
      icon: 'name',
      chapter: 'Un nombre',
      title: { junior: 'La niña que le dio nombre', explorer: 'Identidad', discovery: 'Un nombre escrito por una niña' },
      line: {
        junior: 'Sofi, de 9 años, escribió un ensayo y así Spirit y su gemelo Opportunity tuvieron nombre.',
        explorer: 'Dos días antes del lanzamiento, MER-A y MER-B reciben nombre gracias al ensayo de Sofi Collis, 9 años.',
        discovery: 'Dos días antes del lanzamiento, Sofi Collis, de 9 años, leyó el ensayo que nombró a Spirit y a Opportunity.',
      },
      facts: [sf('name_origin'), SOFI_ESSAY],
      activity: { kind: 'audio' },
      star: 'spirit-historia',
    },
    {
      id: 'aterrizaje',
      icon: 'landing',
      chapter: 'En Marte',
      title: { junior: '¿Dónde aterrizó?', explorer: 'Aterrizaje', discovery: 'Llegada al cráter Gusev' },
      line: {
        junior: 'Spirit llegó envuelto en bolsas de aire. Elige dónde aterrizó.',
        explorer: 'Descenso con airbags. Selecciona el sitio de aterrizaje correcto.',
        discovery: 'Spirit y Opportunity aterrizaron en lugares distintos. ¿Cuál fue el de Spirit?',
      },
      facts: [sf('landing_site'), sf('landing_bounces')],
      activity: {
        kind: 'choice',
        prompt: { junior: '¿Dónde aterrizó Spirit?', explorer: '¿Sitio de aterrizaje de Spirit?', discovery: '¿Dónde aterrizó Spirit?' },
        options: [
          { id: 'gusev', label: 'Cráter Gusev', correct: true, feedback: '¡Correcto! Spirit aterrizó en el cráter Gusev y rebotó 28 veces antes de detenerse.' },
          { id: 'meridiani', label: 'Meridiani Planum', correct: false, feedback: 'Casi: Meridiani Planum fue el lugar de aterrizaje de Opportunity, su rover gemelo. Prueba otra vez.' },
        ],
        bounce: 28,
      },
      gate: true,
      star: 'spirit-actividad',
    },
    {
      id: 'exploracion',
      icon: 'route',
      chapter: 'En Marte',
      title: { junior: '¡A explorar!', explorer: 'Travesía', discovery: 'Seis años de camino' },
      line: {
        junior: 'Arrastra a Spirit por su camino y descubre qué encontró.',
        explorer: 'Arrastra el rover por la ruta. Cada punto desbloquea un registro.',
        discovery: 'Arrastra a Spirit por tres momentos de su travesía por el cráter Gusev.',
      },
      facts: [],
      activity: {
        kind: 'route',
        waypoints: [
          { id: 'husband', label: 'Husband Hill', fact: sf('husband_hill_summit') },
          { id: 'silica', label: 'Suelo de sílice', fact: sf('silica_gertrude_weise') },
          { id: 'troy', label: 'Troy', fact: sf('stuck_troy') },
        ],
      },
    },
    {
      id: 'senal',
      icon: 'signal',
      chapter: 'En Marte',
      title: { junior: 'El último mensaje', explorer: 'Señal perdida', discovery: 'La última señal' },
      line: {
        junior: 'El 22 de marzo de 2010 llegó su último mensaje.',
        explorer: 'Última comunicación: 22 mar 2010 (sol 2210). Misión completa: 25 may 2011.',
        discovery: 'Su última comunicación llegó en marzo de 2010. En mayo de 2011 la NASA declaró la misión completa.',
      },
      facts: [sf('last_communication'), sf('end_of_mission')],
      activity: { kind: 'reveal' },
    },
  ],
  legacy: {
    title: { junior: 'Spirit sigue en Marte', explorer: 'Legado registrado', discovery: 'Lo que dejó Spirit' },
    line: {
      junior: 'Iba a trabajar 90 soles y trabajó más de 6 años. Hoy sigue en Troy, en el cráter Gusev.',
      explorer: 'Previsto: 90 soles. Real: más de 6 años y 7,73 km. Ubicación: Troy, cráter Gusev.',
      discovery: 'Planeado para 90 soles, operó más de seis años. Sigue en Troy, y su ciencia abrió camino a Curiosity y Perseverance.',
    },
    facts: [sf('planned_duration'), sf('actual_duration'), sf('actual_distance'), sf('remains_on_mars'), sf('legacy_later_missions')],
    star: 'spirit-legado',
    badge: 'Huellas de Spirit',
    completeLabel: 'Completar misión Spirit',
    doneTitle: 'Misión Spirit completada',
  },
};

export const OPPORTUNITY_STORY: Story = {
  id: 'opportunity',
  place: 'marte',
  name: 'Opportunity',
  routeTitle: { junior: 'El viaje de Opportunity', explorer: 'RUTA // OPPORTUNITY · MER-B', discovery: 'Opportunity, casi quince años en Marte' },
  backLabel: { junior: 'Volver a Marte', explorer: 'Volver a superficie', discovery: 'Volver a Marte' },
  stops: [
    {
      id: 'construccion',
      icon: 'build',
      chapter: 'Antes del viaje',
      title: { junior: 'El gemelo de Spirit', explorer: 'Ensamblaje MER-B', discovery: 'Un gemelo para el otro lado de Marte' },
      line: {
        junior: 'Opportunity era igualito a Spirit: del tamaño de un carrito de golf. Ponle sus piezas.',
        explorer: 'Rover MER-B · ~185 kg · misión: buscar pistas de agua antigua. Completa el ensamblaje.',
        discovery: 'Gemelo de Spirit, su tarea era buscar en rocas y suelos pistas de agua en el pasado de Marte.',
      },
      facts: [op.objetivo, op.tamano],
      activity: {
        kind: 'assemble',
        target: 'rover',
        parts: [
          { id: 'mastil', label: 'Mástil con Pancam', fact: op.mastil },
          { id: 'brazo', label: 'Brazo con instrumentos', fact: op.brazo },
          { id: 'rat', label: 'Herramienta RAT', fact: op.rat_wtc },
        ],
      },
    },
    {
      id: 'despegue',
      icon: 'rocket',
      chapter: 'Antes del viaje',
      title: { junior: '¡Despegue!', explorer: 'Lanzamiento', discovery: 'La segunda partida' },
      line: {
        junior: 'Mantén pulsado el botón para despegar.',
        explorer: 'Delta 7925H · SLC-17B. Mantén pulsado para iniciar el lanzamiento.',
        discovery: 'El 7 de julio de 2003 un cohete Delta despegó con Opportunity desde Cabo Cañaveral.',
      },
      facts: [op.lanzamiento],
      activity: { kind: 'hold', label: 'Mantén pulsado para despegar' },
    },
    {
      id: 'nombre',
      icon: 'name',
      chapter: 'Un nombre',
      title: { junior: 'Un nombre para los dos', explorer: 'Identidad', discovery: 'Spirit y Opportunity' },
      line: {
        junior: 'El ensayo de Sofi, de 9 años, nombró a los dos gemelos: Spirit y Opportunity.',
        explorer: 'MER-A y MER-B reciben nombre gracias al ensayo de Sofi Collis, 9 años.',
        discovery: 'El mismo ensayo de Sofi Collis, de 9 años, dio nombre a los dos rovers gemelos.',
      },
      facts: [sf('name_origin'), SOFI_ESSAY],
      activity: { kind: 'audio' },
      star: 'opportunity-historia',
    },
    {
      id: 'aterrizaje',
      icon: 'landing',
      chapter: 'En Marte',
      title: { junior: '¿Dónde aterrizó?', explorer: 'Aterrizaje', discovery: 'Un hoyo en el llano' },
      line: {
        junior: 'Llegó 20 días después de Spirit, al otro lado de Marte. ¿Dónde?',
        explorer: '20 días después de MER-A, lado opuesto del planeta. Selecciona el sitio correcto.',
        discovery: 'Veinte días después de Spirit, Opportunity llegó al otro lado de Marte. ¿Dónde?',
      },
      facts: [op.aterrizaje, op.rebotes, op.challenger],
      activity: {
        kind: 'choice',
        prompt: { junior: '¿Dónde aterrizó Opportunity?', explorer: '¿Sitio de aterrizaje de Opportunity?', discovery: '¿Dónde aterrizó Opportunity?' },
        options: [
          { id: 'meridiani', label: 'Meridiani Planum', correct: true, feedback: '¡Correcto! Rebotó al menos 26 veces y se detuvo dentro del pequeño cráter Eagle, en Meridiani Planum.' },
          { id: 'gusev', label: 'Cráter Gusev', correct: false, feedback: 'Casi: el cráter Gusev fue el lugar de Spirit, su gemelo. Prueba otra vez.' },
        ],
        bounce: 26,
        bounceMin: true,
      },
      gate: true,
      star: 'opportunity-actividad',
    },
    {
      id: 'abandonado',
      icon: 'debris',
      chapter: 'Lo que quedó atrás',
      title: { junior: 'Cosas que se quedaron', explorer: 'Rastreo de equipo', discovery: 'Equipo abandonado' },
      line: {
        junior: 'Al irse, dejó atrás las piezas de su viaje. Encuéntralas en la escena.',
        explorer: 'Escanea la escena: localiza el equipo descartado del aterrizaje.',
        discovery: 'Opportunity fotografió el equipo que lo trajo hasta aquí. Búscalo en la escena.',
      },
      facts: [op.abandonado, op.heat_shield_rock],
      activity: {
        kind: 'find',
        items: [
          { id: 'lander', label: 'Módulo de aterrizaje', x: 0.22, y: 0.62 },
          { id: 'paracaidas', label: 'Paracaídas y cubierta trasera', x: 0.5, y: 0.42 },
          { id: 'escudo', label: 'Escudo térmico', x: 0.74, y: 0.66 },
          { id: 'roca', label: 'Heat Shield Rock (meteorito)', x: 0.88, y: 0.78, fact: op.heat_shield_rock },
        ],
      },
    },
    {
      id: 'exploracion',
      icon: 'route',
      chapter: 'En Marte',
      title: { junior: '¡De cráter en cráter!', explorer: 'Travesía', discovery: 'Tres cráteres' },
      line: {
        junior: 'Arrastra a Opportunity de un cráter a otro.',
        explorer: 'Arrastra el rover por la ruta. Cada cráter desbloquea un registro.',
        discovery: 'Arrastra a Opportunity por los tres grandes cráteres de su viaje.',
      },
      facts: [op.maraton],
      activity: {
        kind: 'route',
        waypoints: [
          { id: 'endurance', label: 'Cráter Endurance', fact: op.endurance },
          { id: 'victoria', label: 'Cráter Victoria', fact: op.victoria },
          { id: 'endeavour', label: 'Cráter Endeavour', fact: op.endeavour },
        ],
      },
    },
    {
      id: 'senal',
      icon: 'signal',
      chapter: 'En Marte',
      title: { junior: 'La gran tormenta', explorer: 'Señal perdida', discovery: 'Silencio bajo el polvo' },
      line: {
        junior: 'En 2018 una tormenta de polvo cubrió todo Marte y Opportunity se quedó sin energía.',
        explorer: 'Última comunicación: 10 jun 2018 · tormenta global. Iniciando intentos de recuperación.',
        discovery: 'Una tormenta de polvo global cubrió sus paneles en junio de 2018. Desde la Tierra, el equipo siguió llamándolo.',
      },
      facts: [op.ultimo],
      activity: { kind: 'reveal' },
    },
    {
      id: 'cancion',
      icon: 'song',
      chapter: 'Despedida',
      title: { junior: 'Una canción para Oppy', explorer: 'Última transmisión', discovery: 'La última canción' },
      line: {
        junior: 'El equipo le envió su última llamada y le puso una canción para despedirse.',
        explorer: '12 feb 2019 · Goldstone, antena de 70 m. Envía la última transmisión.',
        discovery: 'El 12 de febrero de 2019 llegó el último intento. Y una canción de despedida.',
      },
      facts: [op.ultimos_comandos, op.ultima_cancion, op.fin],
      activity: { kind: 'song' },
    },
  ],
  legacy: {
    title: { junior: 'Opportunity sigue en Marte', explorer: 'Legado registrado', discovery: 'Lo que dejó Opportunity' },
    line: {
      junior: 'Iba a trabajar 90 días marcianos y duró 60 veces más. ¡Recorrió más que una maratón!',
      explorer: 'Previsto: 90 soles / 1 km. Real: ×60 y 45,16 km. Ubicación: Perseverance Valley.',
      discovery: 'Diseñado para 90 soles, superó 60 veces su vida prevista y descansa en Perseverance Valley.',
    },
    facts: [op.diseno, op.distancia, op.vida, op.pendiente, op.record, op.reposo],
    star: 'opportunity-legado',
    badge: 'Huellas de Opportunity',
    completeLabel: 'Completar misión Opportunity',
    doneTitle: 'Misión Opportunity completada',
  },
};

export const ALSEP_STORY: Story = {
  id: 'alsep',
  place: 'luna',
  name: 'ALSEP',
  routeTitle: { junior: 'La estación de la Luna', explorer: 'RUTA // ALSEP · APOLLO 12', discovery: 'ALSEP, los instrumentos que se quedaron' },
  backLabel: { junior: 'Volver a la Luna', explorer: 'Volver a superficie', discovery: 'Volver a la Luna' },
  stops: [
    {
      id: 'que-es',
      icon: 'station',
      chapter: 'La idea',
      title: { junior: 'Una estación que se queda', explorer: 'Objetivo', discovery: 'Instrumentos para quedarse' },
      line: {
        junior: 'Los astronautas se iban, pero sus instrumentos se quedaban midiendo la Luna.',
        explorer: 'Misión: dejar una estación científica activa cuando la tripulación se vaya.',
        discovery: 'ALSEP se diseñó para seguir enviando datos desde la Luna cuando los astronautas ya no estuvieran.',
      },
      facts: [af('que_es'), af('un_ano')],
      activity: { kind: 'reveal' },
    },
    {
      id: 'apollo11',
      icon: 'seismo',
      chapter: 'La idea',
      title: { junior: 'El primer intento', explorer: 'Prototipo', discovery: 'Lo que aprendieron de Apollo 11' },
      line: {
        junior: 'En Apollo 11 hubo un sismómetro solar: solo funcionaba de día.',
        explorer: 'Apollo 11 · sismómetro solar · solo de día. Apollo 12 · energía nuclear · sin pausa.',
        discovery: 'El sismómetro de Apollo 11 dependía del Sol. El de Apollo 12 ya podía escuchar sin pausa.',
      },
      facts: [af('a11_solar'), af('a12_nuclear')],
      activity: { kind: 'reveal' },
    },
    {
      id: 'apollo12',
      icon: 'module',
      chapter: 'En la Luna',
      title: { junior: 'Arma la estación', explorer: 'Despliegue', discovery: 'Apollo 12 en el Océano de las Tormentas' },
      line: {
        junior: 'Apollo 12 llegó a la Luna en 1969. Coloca cada pieza en su lugar.',
        explorer: 'Apollo 12 · 19 nov 1969. Despliega la estación: coloca los módulos.',
        discovery: 'En noviembre de 1969, Conrad y Bean desplegaron el ALSEP. Recrea su disposición.',
      },
      facts: [af('apollo12'), af('viaje')],
      activity: {
        kind: 'place',
        items: [
          { id: 'central', label: 'Estación central', slot: 'center', fact: af('estacion_central') },
          { id: 'rtg', label: 'Generador RTG', slot: 'side', fact: af('energia') },
          { id: 'sismo', label: 'Sismómetro', slot: 'ring', fact: af('a12_nuclear') },
        ],
      },
      star: 'alsep-historia',
    },
    {
      id: 'energia',
      icon: 'power',
      chapter: 'En la Luna',
      title: { junior: '¿Con qué funcionaba?', explorer: 'Energía', discovery: 'Energía para años' },
      line: {
        junior: 'Su generador daba unos 70 vatios. ¿Con qué funcionaba?',
        explorer: 'Potencia: ~70 W. Identifica la fuente de energía.',
        discovery: 'El sismómetro de Apollo 11 y la estación de Apollo 12 no usaban la misma energía.',
      },
      facts: [af('energia'), af('primera_nuclear')],
      activity: {
        kind: 'choice',
        prompt: { junior: '¿Con qué funcionaba ALSEP?', explorer: '¿Fuente de energía de ALSEP?', discovery: '¿Con qué funcionaba la estación ALSEP de Apollo 12?' },
        options: [
          { id: 'rtg', label: 'Un generador de radioisótopos', correct: true, feedback: '¡Correcto! Un generador SNAP-27 con plutonio-238 alimentaba la estación.' },
          { id: 'solar', label: 'Paneles solares', correct: false, feedback: 'Casi: la energía solar era la del sismómetro de Apollo 11, que solo funcionaba de día. Prueba otra vez.' },
        ],
      },
      gate: true,
      star: 'alsep-actividad',
    },
    {
      id: 'conectar',
      icon: 'station',
      chapter: 'Escuchar la Luna',
      title: { junior: 'Conecta los cables', explorer: 'Instrumentos', discovery: 'Seis instrumentos' },
      line: {
        junior: 'Toca cada instrumento para conectarlo a la estación.',
        explorer: 'Conecta los 6 instrumentos a la estación central.',
        discovery: 'Cada instrumento iba por cable a la estación central. Conéctalos.',
      },
      facts: [af('a12_instrumentos'), af('red_sismica'), af('objetivos')],
      activity: {
        kind: 'network',
        hub: 'Estación central',
        sites: [
          { id: 'pse', label: 'Sismómetro', x: 0.5, y: 0.17 },
          { id: 'lsm', label: 'Magnetómetro', x: 0.8, y: 0.33 },
          { id: 'sws', label: 'Viento solar', x: 0.8, y: 0.67 },
          { id: 'side', label: 'Iones', x: 0.5, y: 0.83 },
          { id: 'ccig', label: 'Atmósfera', x: 0.2, y: 0.67 },
          { id: 'ldd', label: 'Polvo', x: 0.2, y: 0.33 },
        ],
      },
    },
    {
      id: 'sismo',
      icon: 'quake',
      chapter: 'Escuchar la Luna',
      title: { junior: '¡La Luna tiembla!', explorer: 'Calibración', discovery: 'Un impacto planificado' },
      line: {
        junior: 'El plan: dejar caer una parte del módulo lunar para que el sismómetro la sintiera. Pulsa y escucha.',
        explorer: 'Plan de Apollo 12 · impacto de la etapa de ascenso a ~9 km. Reproduce el sismograma ilustrativo.',
        discovery: 'Un impacto planificado para calibrar el sismómetro. Escucha una recreación.',
      },
      facts: [af('impacto_plan')],
      activity: { kind: 'quake' },
    },
    {
      id: 'apagado',
      icon: 'off',
      chapter: 'El final',
      title: { junior: 'Hora de descansar', explorer: 'Apagado', discovery: 'El apagado de 1977' },
      line: {
        junior: 'Debía durar al menos 1 año y funcionó casi 8. Apaga sus instrumentos.',
        explorer: '19 nov 1969 → 30 sep 1977. Ejecuta el apagado de los 6 instrumentos.',
        discovery: 'Pensada para al menos un año, la estación funcionó casi ocho. En 1977 se apagó junto con las demás.',
      },
      facts: [af('encendido'), af('apagado'), af('un_ano')],
      activity: { kind: 'switch', stations: ['Sismómetro', 'Magnetómetro', 'Viento solar', 'Iones', 'Atmósfera', 'Polvo'] },
    },
  ],
  legacy: {
    title: { junior: 'La estación sigue en la Luna', explorer: 'Legado registrado', discovery: 'Lo que dejó ALSEP' },
    line: {
      junior: 'Sigue en el Océano de las Tormentas, donde la dejaron los astronautas.',
      explorer: 'Estación en superficie · 3,0094° S · 23,4246° O. Ruta completada.',
      discovery: 'Sigue en el Océano de las Tormentas, el lugar desde el que se quiso escuchar el interior de la Luna.',
    },
    facts: [af('siguen_alli'), af('muestras'), ...ALSEP_CREW_BIOS],
    star: 'alsep-legado',
    badge: 'Ecos de la Luna',
    completeLabel: 'Completar ruta ALSEP',
    doneTitle: 'Ruta ALSEP completada',
  },
};

export const STORIES = { spirit: SPIRIT_STORY, opportunity: OPPORTUNITY_STORY, alsep: ALSEP_STORY } as const;
export const storyStars = (s: Story) => [...s.stops.filter((x) => x.star).map((x) => x.star!), s.legacy.star];
