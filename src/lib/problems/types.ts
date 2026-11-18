export const SECTIONS = ['sql', 'algorithms', 'pandas', 'stats', 'judgment'] as const;
export type Section = (typeof SECTIONS)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface SectionInfo {
  id: Section;
  name: string;
  short: string;
  description: string;
  /** Tailwind text/bg colour suffix from the theme. */
  color: 'sky' | 'vermilion' | 'jade' | 'violet' | 'amber';
  language: 'sql' | 'python' | 'markdown';
}

export const SECTION_INFO: Record<Section, SectionInfo> = {
  sql: {
    id: 'sql',
    name: 'SQL',
    short: 'SQL',
    description: 'PostgreSQL real en el navegador: JOINs, ventanas, CTEs, cohortes.',
    color: 'sky',
    language: 'sql',
  },
  algorithms: {
    id: 'algorithms',
    name: 'Python · Algoritmos',
    short: 'Algoritmos',
    description: 'Patrones clásicos de entrevista con tests visibles y ocultos.',
    color: 'vermilion',
    language: 'python',
  },
  pandas: {
    id: 'pandas',
    name: 'Python · pandas',
    short: 'pandas',
    description: 'merge, groupby, pivot, fechas y ventanas sobre DataFrames.',
    color: 'jade',
    language: 'python',
  },
  stats: {
    id: 'stats',
    name: 'Estadística y probabilidad',
    short: 'Estadística',
    description: 'Bayes, valor esperado, distribuciones y A/B testing.',
    color: 'violet',
    language: 'markdown',
  },
  judgment: {
    id: 'judgment',
    name: 'Criterio',
    short: 'Criterio',
    description: 'Revisar código de IA, métricas, modelado y rendimiento: lo que la IA no decide por ti.',
    color: 'amber',
    language: 'markdown',
  },
};

/**
 * Industry of each problem. Companies are fictional, but every scenario is the
 * kind of question that comes up in that industry. Derived from the company
 * (COMPANY_INDUSTRY) unless the frontmatter sets `industry`.
 */
export const INDUSTRIES = [
  'ecommerce',
  'marketplace',
  'social',
  'fintech',
  'apps',
  'streaming',
  'mobility',
  'gaming',
  'travel',
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_INFO: Record<Industry, { name: string; about: string }> = {
  ecommerce: { name: 'E-commerce', about: 'pedidos, cestas, devoluciones, cohortes de compra' },
  marketplace: { name: 'Marketplace', about: 'vendedores, comisiones, oferta y demanda' },
  social: { name: 'Redes sociales', about: 'seguidores, engagement, feeds, sesiones' },
  fintech: { name: 'Fintech', about: 'pagos, saldos, fraude, transferencias' },
  apps: { name: 'Apps y SaaS', about: 'suscripciones, conversión, retención, activación' },
  streaming: { name: 'Streaming', about: 'reproducciones, minutos vistos, recomendaciones' },
  mobility: { name: 'Movilidad', about: 'viajes, conductores, ciudades, tiempos de llegada' },
  gaming: { name: 'Videojuegos', about: 'jugadores, partidas, recompensas, monetización' },
  travel: { name: 'Viajes', about: 'reservas, ocupación, cancelaciones' },
};

export const COMPANY_INDUSTRY: Record<string, Industry> = {
  Basketly: 'ecommerce',
  'Loomly Home': 'ecommerce',
  'Shelfie Books': 'ecommerce',
  'Cartwell Marketplace': 'marketplace',
  Chirpnest: 'social',
  'Pennywise Pay': 'fintech',
  Habitly: 'apps',
  Tunely: 'streaming',
  'Lumora Stream': 'streaming',
  'Moviq Rides': 'mobility',
  'Fernplay Games': 'gaming',
  'Nestaway Stays': 'travel',
};

/** A typical mistake: kept to prove the hidden data rejects it, and to explain it. */
export interface WrongAnswer {
  title: string;
  /** Markdown shown when a submission fails exactly like this one. */
  explanation: string;
  code: string;
}

/**
 * What the browser gets instead of the wrong answers' code: the explanation
 * plus a fingerprint of how that wrong answer fails on Submit (see diagnosis.ts).
 */
export interface Diagnosis {
  title: string;
  explanation: string;
  fingerprint: string[] | null;
}

interface BaseProblem {
  id: string;
  slug: string;
  title: string;
  section: Section;
  difficulty: Difficulty;
  topics: string[];
  company: string;
  industry: Industry;
  /** "Fix the AI's code": the starter is plausible AI-written code with a bug. Listed under Criterio too. */
  aiReview: boolean;
  /** Markdown statement (examples and constraints included). */
  statement: string;
  /** Hints, unlocked one at a time. Markdown. */
  hints: string[];
  /** Official solution source (code for sql/python, markdown for stats). */
  solution: string;
  /** Step-by-step explanation, Markdown. */
  explanation: string;
  /** Source file path, useful for error messages. */
  file: string;
}

/** What lists, paths and progress need: everything but the content. */
export type ProblemMeta = Pick<
  BaseProblem,
  'id' | 'slug' | 'title' | 'section' | 'difficulty' | 'topics' | 'company' | 'industry' | 'aiReview'
>;

export interface SqlProblem extends BaseProblem {
  section: 'sql';
  starter: string;
  /** DDL creating the tables. */
  schema: string;
  /** INSERTs for the visible dataset (shown in the statement, used by Run). */
  data: string;
  /** Extra datasets (each a full set of INSERTs) used only on Submit. */
  hiddenData: string[];
  /** When true, row order must match the official solution. */
  orderMatters: boolean;
  /**
   * Plausible wrong queries (never shown in the UI). The test suite checks
   * that each one is rejected on Submit, proving the hidden data has teeth.
   */
  wrongAnswers: WrongAnswer[];
  /** Filled in by the build (plugins/problems.ts); empty when parsed directly. */
  diagnoses?: Diagnosis[];
}

export type Comparator = 'exact' | 'unordered' | 'unordered_deep' | 'float' | 'custom';
export type StructureType = 'linked_list' | 'tree';

export interface PyTestCase {
  args: unknown[];
  /** Omitted -> computed with the official solution. */
  expected?: unknown;
}

export interface AlgorithmsProblem extends BaseProblem {
  section: 'algorithms';
  starter: string;
  /** Name of the function the user implements. */
  function: string;
  comparator: Comparator;
  tolerance: number;
  /** Per-argument conversion from JSON (e.g. list -> linked list). */
  argTypes: (StructureType | null)[] | null;
  returnType: StructureType | null;
  timeLimitMs: number;
  complexity: { time: string; space: string };
  /** Visible cases (Run). */
  tests: PyTestCase[];
  /** Hidden explicit cases (Submit). */
  hiddenTests: PyTestCase[];
  /** Python defining cases() -> iterable of arg lists; expected from the solution. */
  generator: string | null;
  /** Python defining check(got, expected, *args) -> bool for comparator "custom". */
  checker: string | null;
  /** Plausible wrong/slow solutions the tests must reject. */
  wrongAnswers: WrongAnswer[];
  /** Filled in by the build (plugins/problems.ts); empty when parsed directly. */
  diagnoses?: Diagnosis[];
}

export interface PandasProblem extends BaseProblem {
  section: 'pandas';
  starter: string;
  function: string;
  /** Row order must match the official solution. */
  orderMatters: boolean;
  /** Compare dtypes too (default false: 1 == 1.0). */
  checkDtype: boolean;
  tolerance: number;
  /** Python defining cases() -> visible argument lists (DataFrames). */
  dataCode: string;
  /** Python defining cases() -> hidden argument lists. */
  hiddenDataCode: string | null;
  wrongAnswers: WrongAnswer[];
  /** Filled in by the build (plugins/problems.ts); empty when parsed directly. */
  diagnoses?: Diagnosis[];
}

/** Answer-only questions (numeric or multiple choice): Estadística and Criterio. */
export interface StatsProblem extends BaseProblem {
  section: 'stats' | 'judgment';
  answerType: 'numeric' | 'choice';
  /** Numeric answer, or the index of the correct option. */
  answer: number;
  /** Absolute tolerance for numeric answers. */
  tolerance: number;
  /** Markdown options for multiple choice. */
  options: string[];
  /** Python defining answer() that recomputes the numeric answer (tests only). */
  verification: string | null;
}

export type Problem = SqlProblem | AlgorithmsProblem | PandasProblem | StatsProblem;

/** Problems solved by writing code in the editor. */
export type CodeProblem = SqlProblem | AlgorithmsProblem | PandasProblem;

export function isQuiz<P extends Pick<BaseProblem, 'section'>>(p: P): p is P & StatsProblem {
  return p.section === 'stats' || p.section === 'judgment';
}

/** Problems shown under Criterio: its own questions plus the "fix the AI's code" exercises. */
export function inJudgmentTrack(p: Pick<BaseProblem, 'section' | 'aiReview'>): boolean {
  return p.section === 'judgment' || p.aiReview;
}
