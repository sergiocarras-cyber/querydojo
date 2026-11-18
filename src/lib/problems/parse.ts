import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { DIFFICULTIES, SECTIONS, type Problem } from './types.ts';

/**
 * Problem files are Markdown with a YAML frontmatter.
 * The body is split into `## Section` blocks (see README for the format).
 */

const frontmatterSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{3}$/, 'id must look like "sql-001"'),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(3),
  section: z.enum(SECTIONS),
  difficulty: z.enum(DIFFICULTIES),
  topics: z.array(z.string().min(1)).min(1),
  company: z.string().min(2),
  order_matters: z.boolean().optional(),
  // algorithms / pandas
  function: z.string().regex(/^[a-z_][a-z0-9_]*$/).optional(),
  comparator: z.enum(['exact', 'unordered', 'unordered_deep', 'float', 'custom']).optional(),
  tolerance: z.number().positive().optional(),
  arg_types: z.array(z.enum(['linked_list', 'tree']).nullable()).optional(),
  return_type: z.enum(['linked_list', 'tree']).optional(),
  time_limit_ms: z.number().int().positive().optional(),
  complexity: z.object({ time: z.string(), space: z.string() }).optional(),
  check_dtype: z.boolean().optional(),
  // stats
  answer_type: z.enum(['numeric', 'choice']).optional(),
  answer: z.number().optional(),
});

const testCasesSchema = z.array(
  z.object({ args: z.array(z.unknown()), expected: z.unknown().optional() }).strict(),
);

function parseTests(sections: Map<string, string>, name: string, file: string, required: boolean) {
  const raw = sections.get(name);
  if (raw === undefined) {
    if (required) throw new ProblemFormatError(file, `missing "## ${name}" section`);
    return [];
  }
  const blocks = codeBlocks(raw);
  if (blocks.length !== 1 || blocks[0].lang !== 'json') {
    throw new ProblemFormatError(file, `section "${name}" must contain exactly one json code block`);
  }
  let data: unknown;
  try {
    data = JSON.parse(blocks[0].code);
  } catch (e) {
    throw new ProblemFormatError(file, `section "${name}": invalid JSON (${(e as Error).message})`);
  }
  const parsed = testCasesSchema.safeParse(data);
  if (!parsed.success) throw new ProblemFormatError(file, `section "${name}": each case needs "args" (array) and optional "expected"`);
  return parsed.data;
}

function optionalCode(sections: Map<string, string>, name: string): string | null {
  const blocks = codeBlocks(sections.get(name) ?? '');
  return blocks.length ? blocks[0].code : null;
}

export class ProblemFormatError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = 'ProblemFormatError';
  }
}

interface CodeBlock {
  lang: string;
  code: string;
}

/** Splits `---\nyaml\n---\nbody`. */
function splitFrontmatter(raw: string, file: string): { meta: unknown; body: string } {
  const text = raw.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) throw new ProblemFormatError(file, 'missing YAML frontmatter delimited by ---');
  return { meta: parseYaml(match[1]), body: match[2] };
}

/** Splits the body by level-2 headings, ignoring headings inside fenced code. */
function splitSections(body: string, level: 2 | 3): Map<string, string> {
  const marker = level === 2 ? '## ' : '### ';
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];
  let inFence = false;
  const flush = () => {
    if (current !== null) sections.set(current, buffer.join('\n').trim());
  };
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && line.startsWith(marker)) {
      flush();
      current = line.slice(marker.length).trim().toLowerCase();
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

function codeBlocks(markdown: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const re = /^```([^\n]*)\n([\s\S]*?)^```\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    blocks.push({ lang: m[1].trim(), code: m[2].replace(/\n$/, '') });
  }
  return blocks;
}

function requireSection(sections: Map<string, string>, name: string, file: string): string {
  const value = sections.get(name);
  if (value === undefined || value === '') {
    throw new ProblemFormatError(file, `missing "## ${name[0].toUpperCase()}${name.slice(1)}" section`);
  }
  return value;
}

function singleCode(sections: Map<string, string>, name: string, file: string): string {
  const blocks = codeBlocks(requireSection(sections, name, file));
  if (blocks.length !== 1) {
    throw new ProblemFormatError(file, `section "${name}" must contain exactly one code block`);
  }
  return blocks[0].code;
}

export function parseProblem(raw: string, file: string): Problem {
  const { meta, body } = splitFrontmatter(raw, file);
  const parsed = frontmatterSchema.safeParse(meta);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ProblemFormatError(file, `invalid frontmatter (${issues})`);
  }
  const fm = parsed.data;
  const sections = splitSections(body, 2);

  const hintsRaw = requireSection(sections, 'hints', file);
  const hints = [...splitSections(hintsRaw, 3).values()].filter(Boolean);
  if (hints.length === 0) throw new ProblemFormatError(file, 'hints must contain at least one "### Hint" block');

  const base = {
    id: fm.id,
    slug: fm.slug,
    title: fm.title,
    difficulty: fm.difficulty,
    topics: fm.topics,
    company: fm.company,
    statement: requireSection(sections, 'statement', file),
    hints,
    explanation: requireSection(sections, 'explanation', file),
    file,
  };

  switch (fm.section) {
    case 'sql': {
      const hiddenRaw = sections.get('hidden data') ?? '';
      return {
        ...base,
        section: 'sql',
        starter: singleCode(sections, 'starter', file),
        schema: singleCode(sections, 'schema', file),
        data: singleCode(sections, 'data', file),
        hiddenData: codeBlocks(hiddenRaw).map((b) => b.code),
        solution: singleCode(sections, 'solution', file),
        orderMatters: fm.order_matters ?? false,
        wrongAnswers: codeBlocks(sections.get('wrong answers') ?? '').map((b) => b.code),
      };
    }
    case 'algorithms': {
      if (!fm.function) throw new ProblemFormatError(file, 'algorithms problems need "function" in the frontmatter');
      if (!fm.complexity) throw new ProblemFormatError(file, 'algorithms problems need "complexity: {time, space}"');
      const comparator = fm.comparator ?? 'exact';
      const checker = optionalCode(sections, 'checker');
      if (comparator === 'custom' && !checker) throw new ProblemFormatError(file, 'comparator "custom" needs a "## Checker" section');
      const tests = parseTests(sections, 'tests', file, true);
      if (tests.length === 0) throw new ProblemFormatError(file, '"## Tests" needs at least one case');
      if (tests.some((t) => !('expected' in t))) throw new ProblemFormatError(file, 'visible tests must include "expected"');
      return {
        ...base,
        section: 'algorithms',
        function: fm.function,
        comparator,
        tolerance: fm.tolerance ?? 1e-6,
        argTypes: fm.arg_types ?? null,
        returnType: fm.return_type ?? null,
        timeLimitMs: fm.time_limit_ms ?? 2000,
        complexity: fm.complexity,
        starter: singleCode(sections, 'starter', file),
        solution: singleCode(sections, 'solution', file),
        tests,
        hiddenTests: parseTests(sections, 'hidden tests', file, false),
        generator: optionalCode(sections, 'generator'),
        checker,
        wrongAnswers: codeBlocks(sections.get('wrong answers') ?? '').map((b) => b.code),
      };
    }
    case 'pandas': {
      if (!fm.function) throw new ProblemFormatError(file, 'pandas problems need "function" in the frontmatter');
      return {
        ...base,
        section: 'pandas',
        function: fm.function,
        orderMatters: fm.order_matters ?? false,
        checkDtype: fm.check_dtype ?? false,
        tolerance: fm.tolerance ?? 1e-6,
        starter: singleCode(sections, 'starter', file),
        solution: singleCode(sections, 'solution', file),
        dataCode: singleCode(sections, 'data', file),
        hiddenDataCode: optionalCode(sections, 'hidden data'),
        wrongAnswers: codeBlocks(sections.get('wrong answers') ?? '').map((b) => b.code),
      };
    }
    case 'stats': {
      if (!fm.answer_type || fm.answer === undefined) {
        throw new ProblemFormatError(file, 'stats problems need "answer_type" and "answer"');
      }
      const options = (sections.get('options') ?? '')
        .split('\n')
        .filter((l) => /^\s*-\s+/.test(l))
        .map((l) => l.replace(/^\s*-\s+/, '').trim());
      if (fm.answer_type === 'choice') {
        if (options.length < 2) throw new ProblemFormatError(file, 'choice problems need at least 2 "- option" lines in "## Options"');
        if (!Number.isInteger(fm.answer) || fm.answer < 0 || fm.answer >= options.length) {
          throw new ProblemFormatError(file, '"answer" must be the 0-based index of the correct option');
        }
      }
      const verification = optionalCode(sections, 'verification');
      if (fm.answer_type === 'numeric' && !verification) {
        throw new ProblemFormatError(file, 'numeric stats problems need a "## Verification" python block');
      }
      return {
        ...base,
        section: 'stats',
        answerType: fm.answer_type,
        answer: fm.answer,
        tolerance: fm.tolerance ?? 1e-3,
        options,
        verification,
        solution: base.explanation,
      };
    }
    default:
      throw new ProblemFormatError(file, `section "${fm.section}" is not supported yet`);
  }
}
