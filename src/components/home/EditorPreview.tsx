import { useEffect, useState } from 'react';

/**
 * Decorative editor window for the home page: cycles through a SQL, a Python
 * and a pandas snippet (official solutions of real problems) ending in an "accepted" verdict.
 * Purely visual; the real editor is Monaco on the problem page.
 */

interface Snippet {
  tab: string;
  lang: 'sql' | 'python';
  file: string;
  code: string;
  verdict: string;
}

const SNIPPETS: Snippet[] = [
  {
    tab: 'SQL',
    lang: 'sql',
    file: 'category_share.sql',
    code: `SELECT category,
       SUM(amount) AS revenue,
       ROUND(100 * SUM(amount)
             / SUM(SUM(amount)) OVER (), 1) AS pct_of_total
FROM   order_items
WHERE  sold_at >= '2025-04-01' AND sold_at < '2025-07-01'
GROUP  BY category
ORDER  BY revenue DESC, category;`,
    verdict: 'datos de ejemplo y ocultos',
  },
  {
    tab: 'Python',
    lang: 'python',
    file: 'gift_card_pair.py',
    code: `def gift_card_pair(prices, budget):
    seen = {}
    for i, price in enumerate(prices):
        if budget - price in seen:
            return [seen[budget - price], i]
        seen[price] = i`,
    verdict: 'casos visibles y ocultos · O(n)',
  },
  {
    tab: 'pandas',
    lang: 'python',
    file: 'revenue_per_category.py',
    code: `def revenue_per_category(products, sales):
    df = sales.merge(products, on="product_id")
    df["revenue"] = df["price"] * df["quantity"]
    out = (df.groupby("category", as_index=False)
             ["revenue"].sum())
    return out.sort_values(["revenue", "category"],
                           ascending=[False, True])`,
    verdict: 'casos visibles y ocultos',
  },
];

const SQL_KW = new Set(
  'SELECT FROM WHERE GROUP BY ORDER AS SUM ROUND OVER DESC ASC JOIN ON AND OR LIMIT'.split(' '),
);
const PY_KW = new Set('def return for in if else elif not and or import from as False True None'.split(' '));
const PY_BUILTIN = new Set('enumerate len range sum sorted min max'.split(' '));

/** Tiny highlighter, good enough for three known snippets. */
function highlight(code: string, lang: Snippet['lang']) {
  const tokens = code.match(/"[^"]*"|'[^']*'|\d+(?:\.\d+)?|\w+|\s+|./g) ?? [];
  return tokens.map((t, i) => {
    let cls = '';
    if (/^["']/.test(t)) cls = 'text-jade';
    else if (/^\d/.test(t)) cls = 'text-amber';
    else if (lang === 'sql' ? SQL_KW.has(t) : PY_KW.has(t)) cls = 'text-vermilion';
    else if (lang === 'python' && PY_BUILTIN.has(t)) cls = 'text-sky';
    else if (lang === 'python' && tokens[i - 2] === 'def') cls = 'text-violet';
    return cls ? (
      <span key={i} className={cls}>
        {t}
      </span>
    ) : (
      t
    );
  });
}

export function EditorPreview() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % SNIPPETS.length), 5000);
    return () => window.clearInterval(t);
  }, [paused]);

  const s = SNIPPETS[active];
  return (
    <div
      className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900/95 shadow-2xl shadow-black/50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 border-b border-ink-700 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <div className="ml-3 flex gap-1" role="tablist" aria-label="Ejemplos">
          {SNIPPETS.map((sn, i) => (
            <button
              key={sn.tab}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                i === active ? 'bg-ink-800 text-ink-100' : 'text-ink-500 hover:text-ink-300'
              }`}
            >
              {sn.tab}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden font-mono text-[11px] text-ink-500 sm:inline">{s.file}</span>
      </div>
      <pre key={active} className="animate-fade-in min-h-[13.5rem] overflow-x-auto px-4 py-4 font-mono text-[11px] leading-6 sm:text-[12.5px] text-ink-200">
        <code>
          {highlight(s.code, s.lang)}
          <span className="animate-blink ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] bg-ink-300" />
        </code>
      </pre>
      <div key={`v${active}`} className="animate-fade-in flex items-center gap-2 overflow-hidden border-t whitespace-nowrap border-ink-700 bg-jade/[0.06] px-4 py-2.5 font-mono text-xs [animation-delay:0.25s]">
        <span className="text-jade">✓ Aceptado</span>
        <span className="text-ink-500">· {s.verdict}</span>
      </div>
    </div>
  );
}
