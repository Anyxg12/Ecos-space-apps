/**
 * Hechos verificados de Opportunity (MER-B). Fuente única: página oficial de la misión en NASA Science,
 * consultada el 14 de noviembre de 2026. No se añade nada que no esté en esa página.
 */
export interface RoverFact {
  id: string;
  label: string;
  value: string;
  source: { publisher: string; url: string };
  /** Material complementario: se muestra plegado en «Biografía adicional» o «Lectura adicional», no entre los hechos principales. */
  extra?: 'bio' | 'reading';
}

const NASA_OPPORTUNITY = { publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/mer-opportunity/' };

export const OPPORTUNITY_FACTS: RoverFact[] = [
  {
    id: 'nombre',
    label: 'Nombre oficial',
    value: 'Mars Exploration Rover Opportunity (MER-B), gemelo de Spirit dentro de la misión Mars Exploration Rover.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'lanzamiento',
    label: 'Lanzamiento',
    value: '7 de julio de 2003, desde Cabo Cañaveral (Florida), en un cohete Delta 7925H.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'aterrizaje',
    label: 'Aterrizaje',
    value: '24 de enero de 2004 (hora del Pacífico de EE. UU.), en Meridiani Planum, dentro del cráter de impacto Eagle; 20 días después que Spirit.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'abandonado',
    label: 'Lo que quedó atrás',
    value: 'Al salir de Eagle fotografió la zona abandonada donde aún se veían el módulo de aterrizaje, la cubierta trasera y el paracaídas. Junto a su escudo térmico desechado halló «Heat Shield Rock», un meteorito de hierro y níquel.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'distancia',
    label: 'Distancia recorrida',
    value: '45,16 km (28,06 millas) cuando la NASA dio por terminada la misión; estaba diseñado para recorrer unos 1 000 m.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'ultimo',
    label: 'Último contacto',
    value: '10 de junio de 2018, durante una tormenta de polvo que cubrió todo Marte. La NASA declaró el fin de la misión el 13 de febrero de 2019.',
    source: NASA_OPPORTUNITY,
  },
  {
    id: 'reposo',
    label: 'Dónde sigue',
    value: 'En Perseverance Valley, en Marte, su lugar de reposo final.',
    source: NASA_OPPORTUNITY,
  },
];

/**
 * Hechos adicionales para la ruta narrativa de Opportunity. Misma fuente (NASA Science, página de la misión,
 * consultada el 14 de noviembre de 2026). Registro: ecos-research/opportunity-hechos.md.
 */
const of = (id: string, label: string, value: string): RoverFact => ({ id, label, value, source: NASA_OPPORTUNITY });
export const OPP_FACTS = {
  objetivo: of('objetivo', 'Su objetivo', 'Junto con Spirit, buscar distintos tipos de rocas y suelos y pistas de actividad pasada de agua en Marte.'),
  tamano: of('tamano', 'Tamaño', 'Como un carrito de golf y unos 185 kg: siete veces más pesado que Sojourner.'),
  mastil: of('mastil', 'El mástil', 'Sus cámaras iban en un mástil a unos 1,5 m del suelo y daban vistas estereoscópicas de 360 grados.'),
  brazo: of('brazo', 'El brazo', 'El brazo robótico (IDD) llevaba el espectrómetro Mössbauer, el APXS, los imanes, el generador de imágenes microscópicas y la herramienta RAT, y los apoyaba sobre rocas y suelo.'),
  rat_wtc: of('rat_wtc', 'Un homenaje en la RAT', 'En 2011 la NASA anunció que una funda de aluminio de la RAT de cada rover se hizo con aluminio recuperado de las Torres Gemelas, como homenaje a las víctimas del 11-S.'),
  lanzamiento: of('lanzamiento', 'Lanzamiento', '7 de julio de 2003, 20:18:15 (hora del Pacífico), desde Cabo Cañaveral (SLC-17B), en un cohete Delta 7925H. Viajó unos seis meses.'),
  aterrizaje: of('aterrizaje', 'Aterrizaje', 'Tocó suelo el 25 de enero de 2004 (04:54 UTC; 24 de enero en hora del Pacífico), 20 días después de Spirit, al otro lado del planeta.'),
  rebotes: of('rebotes', 'Bolsas de aire', 'Envuelto en bolsas de aire, rebotó al menos 26 veces antes de detenerse en Meridiani Planum, dentro del cráter Eagle.'),
  challenger: of('challenger', 'Un nombre para el lugar', 'La zona se llamó Challenger Memorial Station, en homenaje a la tripulación del transbordador perdida en 1986.'),
  abandonado: of('abandonado', 'Lo que quedó atrás', 'Al salir del cráter Eagle fotografió la zona abandonada donde aún se veían el módulo de aterrizaje, la cubierta trasera y el paracaídas.'),
  heat_shield_rock: of('heat_shield_rock', 'Heat Shield Rock', 'En enero de 2005, junto a su escudo térmico desechado, halló una roca del tamaño de un balón de baloncesto: un meteorito de hierro y níquel.'),
  endurance: of('endurance', 'Cráter Endurance', 'El 22 de marzo de 2004 salió del cráter Eagle rumbo al cráter Endurance, a unos 750 m.'),
  victoria: of('victoria', 'Cráter Victoria', 'Llegó en septiembre de 2006; mide unos 800 m de diámetro. Entró el 11 de septiembre de 2007 y pasó casi un año dentro.'),
  endeavour: of('endeavour', 'Cráter Endeavour', 'Tras casi tres años de viaje (unos 21 km), llegó el 9 de agosto de 2011 a este cráter de unos 22 km de diámetro.'),
  maraton: of('maraton', 'Una maratón en Marte', 'El 25 de marzo de 2015 superó 42,195 km: la primera empresa humana en recorrer la distancia de una maratón en otro mundo.'),
  pendiente: of('pendiente', 'La cuesta más empinada', 'El 10 de marzo de 2016 condujo con una inclinación de 32 grados, récord de pendiente para un rover en Marte.'),
  ultimo: of('ultimo', 'Última señal', 'El 10 de junio de 2018, durante una tormenta de polvo que cubrió todo Marte y redujo la energía de sus paneles solares.'),
  fin: of('fin', 'Fin de la misión', 'La NASA declaró completada la misión el 13 de febrero de 2019.'),
  diseno: of('diseno', 'Lo planeado', 'Estaba diseñado para 90 días marcianos y 1 000 m de recorrido; superó 60 veces su vida prevista.'),
  distancia: of('distancia', 'Distancia final', '45,16 km (28,06 millas) en su odómetro.'),
  record: of('record', 'Un récord que duró', 'Su récord de distancia fuera de la Tierra se mantuvo hasta que el rover Perseverance lo superó el 11 de octubre de 2026.'),
  reposo: of('reposo', 'Dónde sigue', 'En Perseverance Valley, en Marte, su lugar de reposo final.'),
  ultimos_comandos: {
    id: 'ultimos_comandos',
    label: 'La última llamada',
    value: 'La noche del 12 de febrero de 2019, tras más de mil comandos en ocho meses, el control de misión de JPL envió los últimos comandos pidiéndole que llamara a casa, por la antena de 70 m de Goldstone (California). No hubo respuesta.',
    source: { publisher: 'NASA Jet Propulsion Laboratory', url: 'https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/' },
  },
  ultima_cancion: {
    id: 'ultima_cancion',
    label: 'La última canción',
    value: 'La canción final que los ingenieros pusieron para Opportunity fue «I\'ll Be Seeing You», popularizada en 1944 por Bing Crosby y después por Billie Holiday.',
    source: { publisher: 'NASA History Division · News & Notes (2019)', url: 'https://www.nasa.gov/wp-content/uploads/2023/01/NewsNotes-36-1-Spring-2019.pdf' },
  },
  vida: of('vida', 'Su gran hallazgo', 'Encontró indicios de que Marte pudo, en algún momento, sostener vida microbiana.'),
} satisfies Record<string, RoverFact>;
