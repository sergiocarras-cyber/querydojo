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
      className="overflow-hidden rounded-2xl bg-ink-900 shadow-float ring-1 ring-ink-700/70"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 border-b border-ink-700/70 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-ink-700" />
        <span className="h-3 w-3 rounded-full bg-ink-700" />
        <span className="h-3 w-3 rounded-full bg-ink-700" />
        <div className="ml-4 inline-flex gap-0.5 rounded-[9px] bg-ink-800 p-[2px]" role="tablist" aria-label="Ejemplos">
          {SNIPPETS.map((sn, i) => (
            <button
              key={sn.tab}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`rounded-[7px] px-2.5 py-0.5 text-[12px] font-medium transition-colors duration-200 ${
                i === active ? 'segment-on' : 'text-ink-500 hover:text-ink-200'
              }`}
            >
              {sn.tab}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden font-mono text-[11px] text-ink-500 sm:inline">{s.file}</span>
      </div>
      <pre key={active} className="animate-fade-in min-h-[13.5rem] overflow-x-auto px-5 py-5 font-mono text-[11px] leading-6 text-ink-200 sm:text-[13px]">
        <code>
          {highlight(s.code, s.lang)}
          <span className="animate-blink ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] bg-ink-300" />
        </code>
      </pre>
      <div key={`v${active}`} className="animate-fade-in flex items-center gap-2 overflow-hidden border-t whitespace-nowrap border-ink-700 bg-jade/[0.06] px-5 py-3 text-[13px] [animation-delay:0.25s]">
        <span className="font-semibold text-jade">✓ Aceptado</span>
        <span className="text-ink-500">· {s.verdict}</span>
      </div>
    </div>
  );
}
