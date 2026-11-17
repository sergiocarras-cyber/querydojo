import type { Section } from './problems/types';

/**
 * Study paths: an ordered route through one section, grouped in steps.
 * Problems are referenced by id; tests check every id exists and that each
 * path covers its section exactly once.
 */
export interface PathStep {
  title: string;
  summary: string;
  problems: string[];
}

export interface StudyPath {
  id: string;
  title: string;
  section: Section;
  description: string;
  steps: PathStep[];
}

export const STUDY_PATHS: StudyPath[] = [
  {
    id: 'sql-esencial',
    title: 'SQL esencial',
    section: 'sql',
    description:
      'De GROUP BY a funciones ventana y sesiones: el SQL que se pregunta en entrevistas de data analyst y data engineer.',
    steps: [
      {
        title: 'Filtrar y agregar',
        summary: 'WHERE, GROUP BY, HAVING, CASE y limpieza básica de texto.',
        problems: ['sql-003', 'sql-015', 'sql-001', 'sql-013', 'sql-011', 'sql-012'],
      },
      {
        title: 'Fechas',
        summary: 'DATE_TRUNC, EXTRACT y agregados por periodo.',
        problems: ['sql-005', 'sql-014', 'sql-004'],
      },
      {
        title: 'JOINs y anti-joins',
        summary: 'LEFT JOIN, EXISTS, self-joins y el fan-out que duplica sumas.',
        problems: ['sql-002', 'sql-019', 'sql-016', 'sql-008', 'sql-023'],
      },
      {
        title: 'Agregación condicional',
        summary: 'FILTER, pivotes, embudos y percentiles.',
        problems: ['sql-022', 'sql-024', 'sql-020'],
      },
      {
        title: 'Funciones ventana',
        summary: 'RANK, ROW_NUMBER, LAG/LEAD, totales acumulados y medias móviles.',
        problems: ['sql-018', 'sql-006', 'sql-007', 'sql-021', 'sql-025', 'sql-009', 'sql-017'],
      },
      {
        title: 'Patrones avanzados',
        summary: 'Sesiones, gaps and islands, solapes de intervalos y CTE recursivas.',
        problems: ['sql-029', 'sql-026', 'sql-028', 'sql-030'],
      },
      {
        title: 'Cohortes y retención',
        summary: 'Las preguntas de producto más típicas de las entrevistas de analytics.',
        problems: ['sql-010', 'sql-027'],
      },
    ],
  },
  {
    id: 'patrones-algoritmos',
    title: 'Patrones de algoritmos',
    section: 'algorithms',
    description:
      'Los diez patrones que resuelven la mayoría de preguntas de coding, en el orden en que conviene aprenderlos.',
    steps: [
      {
        title: 'Arrays y hashing',
        summary: 'Diccionarios y conjuntos para pasar de O(n²) a O(n).',
        problems: ['algo-001', 'algo-011', 'algo-012', 'algo-022', 'algo-023', 'algo-024'],
      },
      {
        title: 'Two pointers',
        summary: 'Dos índices que avanzan sobre datos ordenados o desde los extremos.',
        problems: ['algo-002', 'algo-013', 'algo-014', 'algo-025'],
      },
      {
        title: 'Sliding window',
        summary: 'Ventanas fijas y variables con un contador que se actualiza en O(1).',
        problems: ['algo-015', 'algo-005', 'algo-026', 'algo-037'],
      },
      {
        title: 'Stack',
        summary: 'Pilas para emparejar, deshacer y pilas monótonas.',
        problems: ['algo-003', 'algo-016', 'algo-027', 'algo-028', 'algo-038'],
      },
      {
        title: 'Binary search',
        summary: 'Sobre arrays ordenados y sobre el espacio de respuestas.',
        problems: ['algo-017', 'algo-018', 'algo-006', 'algo-029'],
      },
      {
        title: 'Linked list',
        summary: 'Punteros, nodos centinela y el truco de los dos punteros.',
        problems: ['algo-019', 'algo-004', 'algo-030'],
      },
      {
        title: 'Trees',
        summary: 'BFS por niveles, DFS recursivo e invariantes de BST.',
        problems: ['algo-020', 'algo-021', 'algo-007', 'algo-031'],
      },
      {
        title: 'Graphs',
        summary: 'BFS en grids, orden topológico y caminos mínimos.',
        problems: ['algo-008', 'algo-032', 'algo-033', 'algo-039'],
      },
      {
        title: 'Heaps',
        summary: 'Top-k y barridos con heapq.',
        problems: ['algo-009', 'algo-034', 'algo-035'],
      },
      {
        title: 'Programación dinámica',
        summary: 'Subproblemas, tablas y la combinación con binary search.',
        problems: ['algo-036', 'algo-010', 'algo-040'],
      },
    ],
  },
  {
    id: 'pandas-entrevistas',
    title: 'pandas para entrevistas',
    section: 'pandas',
    description: 'Joins, limpieza, groupby, series temporales y los casos de producto que piden en las pruebas técnicas.',
    steps: [
      {
        title: 'Filtrar y unir',
        summary: 'Máscaras booleanas, merge y anti-joins.',
        problems: ['pandas-004', 'pandas-001', 'pandas-005', 'pandas-002'],
      },
      {
        title: 'Limpieza',
        summary: 'Métodos str, nulos por grupo y deduplicación.',
        problems: ['pandas-003', 'pandas-006', 'pandas-013'],
      },
      {
        title: 'Agrupar y remodelar',
        summary: 'groupby, pivot_table y rank por grupo.',
        problems: ['pandas-007', 'pandas-008', 'pandas-009'],
      },
      {
        title: 'Series temporales',
        summary: 'shift, rolling, reindex y cumcount.',
        problems: ['pandas-010', 'pandas-011', 'pandas-012'],
      },
      {
        title: 'Casos de producto',
        summary: 'Sesiones y tablas de retención por cohorte.',
        problems: ['pandas-014', 'pandas-015'],
      },
    ],
  },
  {
    id: 'probabilidad-entrevistas',
    title: 'Probabilidad para entrevistas',
    section: 'stats',
    description: 'Del conteo básico a Bayes, valor esperado y A/B testing: lo que se pregunta a data scientists y analysts.',
    steps: [
      {
        title: 'Fundamentos',
        summary: 'Contar casos y la regla del complemento.',
        problems: ['stats-001', 'stats-002', 'stats-015'],
      },
      {
        title: 'Condicionada y Bayes',
        summary: 'Tasas base, actualización bayesiana y la paradoja de Simpson.',
        problems: ['stats-003', 'stats-019', 'stats-016'],
      },
      {
        title: 'Valor esperado y varianza',
        summary: 'Linealidad de la esperanza y varianza de sumas.',
        problems: ['stats-004', 'stats-017', 'stats-005', 'stats-018', 'stats-014'],
      },
      {
        title: 'Distribuciones',
        summary: 'Binomial, Poisson y normal.',
        problems: ['stats-006', 'stats-007', 'stats-008'],
      },
      {
        title: 'Inferencia y A/B testing',
        summary: 'Errores, p-valores, intervalos, potencia y comparaciones múltiples.',
        problems: ['stats-011', 'stats-010', 'stats-013', 'stats-009', 'stats-012', 'stats-020'],
      },
    ],
  },
];

export function getPath(id: string): StudyPath | undefined {
  return STUDY_PATHS.find((p) => p.id === id);
}

export function pathProblemIds(path: StudyPath): string[] {
  return path.steps.flatMap((s) => s.problems);
}
