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

export type Problem = SqlProblem;
