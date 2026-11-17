export const SECTIONS = ['sql', 'algorithms', 'pandas', 'stats'] as const;
export type Section = (typeof SECTIONS)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface SectionInfo {
  id: Section;
  name: string;
  short: string;
  description: string;
  /** Tailwind text/bg colour suffix from the theme (sky, vermilion, jade, violet). */
  color: 'sky' | 'vermilion' | 'jade' | 'violet';
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
};

interface BaseProblem {
  id: string;
  slug: string;
  title: string;
  section: Section;
  difficulty: Difficulty;
  topics: string[];
  company: string;
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
  wrongAnswers: string[];
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
  wrongAnswers: string[];
}

export type Problem = SqlProblem | AlgorithmsProblem;
