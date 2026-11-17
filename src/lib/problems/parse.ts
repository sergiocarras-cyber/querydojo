import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { DIFFICULTIES, SECTIONS, type Problem } from './types';

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
});

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
      };
    }
    default:
      throw new ProblemFormatError(file, `section "${fm.section}" is not supported yet`);
  }
}
