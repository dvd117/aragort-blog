// David, edit working titles here. This is the single editable source for the metro experiment.

export type Direction = 'pol' | 'anden';
export type LineId = 'l1' | 'l2' | 'l3' | 'l4' | 'l5';
export type StationId =
  | 'chatbots'
  | 'terminal'
  | 'instrucciones'
  | 'usalos'
  | 'nodependas'
  | 'markdown'
  | 'sincronizo'
  | 'wiki'
  | 'carrera'
  | 'anthropic'
  | 'cuba';
export type GridPoint = [number, number];

export interface MetroLine {
  id: LineId;
  num: number;
  name: string;
  colour: Record<Direction, string>;
}

export interface MetroStation {
  id: StationId;
  title: string;
  label: string;
  home: LineId;
  slug?: string;
  pos: GridPoint;
  labelSide: 'N' | 'S' | 'E' | 'W';
}

export interface MetroRoute {
  track: GridPoint[];
  stops: StationId[];
}

export const LINES: MetroLine[] = [
  { id: 'l1', num: 1, name: 'El punto de quiebre', colour: { pol: '#d4501a', anden: '#f2792b' } },
  { id: 'l2', num: 2, name: 'Las herramientas del practicante', colour: { pol: '#a67c00', anden: '#f3c12e' } },
  { id: 'l3', num: 3, name: 'La infraestructura propia', colour: { pol: '#1c5fae', anden: '#4e93e6' } },
  { id: 'l4', num: 4, name: 'El contexto del sector', colour: { pol: '#1b7f45', anden: '#35b168' } },
  { id: 'l5', num: 5, name: 'Otros escritos', colour: { pol: '#566170', anden: '#8f98a3' } },
];

export const GROUNDS = {
  pol: { bg: '#f1ebdd', ink: '#17140f', ink2: '#5a5246' },
  anden: { bg: '#0b0c0e', fg: '#ecebe6', fg2: '#9ea3aa' },
};

export const STATIONS: MetroStation[] = [
  { id: 'chatbots', title: 'Por qué dejé los chatbots', label: 'Por qué dejé\nlos chatbots', home: 'l1', slug: 'por-que-deje-los-chatbots', pos: [0, 6], labelSide: 'N' },
  { id: 'terminal', title: 'La terminal y GitHub', label: 'La terminal\ny GitHub', home: 'l2', pos: [4, 6], labelSide: 'S' },
  { id: 'instrucciones', title: 'Tus instrucciones, tus reglas', label: 'Tus instrucciones,\ntus reglas', home: 'l2', pos: [4, 4], labelSide: 'E' },
  { id: 'usalos', title: 'Úsalos todos', label: 'Úsalos todos', home: 'l2', pos: [4, 2], labelSide: 'E' },
  { id: 'nodependas', title: 'No dependas de una sola empresa', label: 'No dependas de\nuna sola empresa', home: 'l2', pos: [6, 0], labelSide: 'E' },
  { id: 'markdown', title: 'Markdown como sustrato', label: 'Markdown\ncomo sustrato', home: 'l3', pos: [8, 6], labelSide: 'N' },
  { id: 'sincronizo', title: 'Cómo sincronizo todo', label: 'Cómo sincronizo\ntodo', home: 'l3', pos: [8, 8], labelSide: 'E' },
  { id: 'wiki', title: 'Mi wiki personal con LLMs', label: 'Mi wiki personal\ncon LLMs', home: 'l3', pos: [10, 10], labelSide: 'E' },
  { id: 'carrera', title: 'La carrera de los modelos', label: 'La carrera de\nlos modelos', home: 'l4', pos: [12, 6], labelSide: 'S' },
  { id: 'anthropic', title: 'Anthropic y los cambios de política', label: 'Anthropic y los\ncambios de política', home: 'l4', pos: [14, 4], labelSide: 'E' },
  { id: 'cuba', title: 'El acceso a Internet como nuevo motor de la movilización social en Cuba', label: 'Internet\nen Cuba', home: 'l5', slug: 'acceso-a-internet-y-movilizacion-social-en-cuba', pos: [0, 8], labelSide: 'E' },
];

export const ROUTES: Record<LineId, MetroRoute> = {
  l1: { track: [[0, 6], [12, 6]], stops: ['chatbots', 'terminal', 'markdown', 'carrera'] },
  l2: { track: [[4, 6], [4, 2], [6, 0]], stops: ['terminal', 'instrucciones', 'usalos', 'nodependas'] },
  l3: { track: [[8, 6], [8, 8], [10, 10]], stops: ['markdown', 'sincronizo', 'wiki'] },
  l4: { track: [[12, 6], [14, 4]], stops: ['carrera', 'anthropic'] },
  l5: { track: [[0, 6], [0, 8]], stops: ['chatbots', 'cuba'] },
};

export const COPY = {
  autor: 'David Aragort',
  sobreMi: 'Sobre mí',
  tituloPlano: 'Cada escrito es una estación.',
  lede: 'Esta serie crece línea por línea; ya puedes leer dos estaciones y las demás llegarán próximamente.',
  planoNoAEscala: 'Plano no a escala',
  desliza: 'Desliza para ver el plano completo',
  lineas: 'Líneas',
  estaciones: 'Estaciones',
  versionActual: 'Versión actual del sitio',
  rss: 'RSS',
  enConstruccion: 'En construcción',
  proximamente: 'Próximamente',
  transbordo: 'Transbordo',
  linea: 'Línea',
  estacion: 'Estación',
  minLectura: 'min de lectura',
  informacion: 'Información al usuario',
  usted: 'Usted está aquí',
  proxima: 'Próxima estación',
};
