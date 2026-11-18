import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';
import { parseProblem } from '../src/lib/problems/parse.ts';
import type { Problem, ProblemMeta, Section } from '../src/lib/problems/types.ts';

/**
 * Parses every problems/**\/*.md file at build time (and on change in dev) and
 * exposes two virtual modules:
 *
 * - `virtual:problem-index`: metadata only, small, used by lists and the home page.
 * - `virtual:problems/<section>`: full content of one section, loaded on demand by
 *   the solver pages (so opening a SQL problem never downloads the pandas ones).
 *
 * Parsing in Node means the browser ships no YAML/zod parser, and a malformed
 * problem file fails the build instead of a page.
 */
const INDEX_ID = 'virtual:problem-index';
const FULL_PREFIX = 'virtual:problems/';
const SECTION_ORDER: Record<Section, number> = { sql: 0, algorithms: 1, pandas: 2, stats: 3 };

export function loadProblemFiles(root: string): { problems: Problem[]; files: string[] } {
  const dir = join(root, 'problems');
  const files: string[] = [];
  const problems: Problem[] = [];
  for (const section of readdirSync(dir)) {
    for (const file of readdirSync(join(dir, section))) {
      if (!file.endsWith('.md')) continue;
      const path = join(dir, section, file);
      files.push(path);
      const rel = '/' + relative(root, path).split(sep).join('/');
      problems.push(parseProblem(readFileSync(path, 'utf8'), rel));
    }
  }
  for (const key of ['id', 'slug'] as const) {
    const seen = new Set<string>();
    for (const p of problems) {
      if (seen.has(p[key])) throw new Error(`Duplicate problem ${key}: ${p[key]} (${p.file})`);
      seen.add(p[key]);
    }
  }
  problems.sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || a.id.localeCompare(b.id));
  return { problems, files };
}

export function toMeta(p: Problem): ProblemMeta {
  const { id, slug, title, section, difficulty, topics, company } = p;
  return { id, slug, title, section, difficulty, topics, company };
}

export function problemsPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: 'querydojo-problems',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === INDEX_ID || id.startsWith(FULL_PREFIX)) return '\0' + id;
    },
    load(id) {
      if (!id.startsWith('\0virtual:problem')) return;
      const name = id.slice(1);
      const { problems, files } = loadProblemFiles(root);
      for (const f of files) this.addWatchFile(f);
      let data: unknown;
      if (name === INDEX_ID) data = problems.map(toMeta);
      else {
        const section = name.slice(FULL_PREFIX.length);
        if (!(section in SECTION_ORDER)) throw new Error(`Unknown problem section module: ${name}`);
        data = problems.filter((p) => p.section === section);
      }
      // JSON.parse of a string literal is faster to evaluate than a big object literal.
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(data))});`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.includes(`${sep}problems${sep}`) || !file.endsWith('.md')) return;
      for (const id of [INDEX_ID, ...Object.keys(SECTION_ORDER).map((s) => FULL_PREFIX + s)]) {
        const mod = server.moduleGraph.getModuleById('\0' + id);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
