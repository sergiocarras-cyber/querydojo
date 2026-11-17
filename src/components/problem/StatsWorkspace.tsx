import { useState } from 'react';
import { recordSubmission } from '../../lib/progress/store';
import type { StatsProblem } from '../../lib/problems/types';
import { formatNumber, isNumericCorrect, parseNumericAnswer } from '../../lib/stats/answer';
import { readJson, writeJson } from '../../lib/storage/local';
import { Markdown } from '../Markdown';
import { Banner } from './Banner';

type Result = { correct: boolean; given: string } | null;

export function StatsWorkspace({ problem }: { problem: StatsProblem }) {
  const draftKey = `draft:${problem.id}`;
  const [value, setValue] = useState(() => readJson<string>(draftKey, ''));
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const check = () => {
    setError(null);
    let correct: boolean;
    let given: string;
    if (problem.answerType === 'numeric') {
      const parsed = parseNumericAnswer(value);
      if (parsed === null) {
        setError('No entiendo ese número. Usa por ejemplo 0.375, 3/8 o 37.5%.');
        return;
      }
      correct = isNumericCorrect(parsed, problem.answer, problem.tolerance);
      given = value.trim();
    } else {
      if (choice === null) {
        setError('Elige una opción.');
        return;
      }
      correct = choice === problem.answer;
      given = `Opción ${String.fromCharCode(65 + choice)}`;
    }
    setResult({ correct, given });
    setShowExplanation(correct);
    recordSubmission(problem.id, {
      verdict: correct ? 'accepted' : 'wrong',
      passed: correct ? 1 : 0,
      total: 1,
      ms: 0,
      code: given,
      detail: correct ? 'Respuesta correcta' : `Respuesta incorrecta: ${given}`,
    });
  };

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-3">
        <span className="font-mono text-xs text-violet">
          {problem.answerType === 'numeric' ? 'Respuesta numérica' : 'Elige una opción'}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {problem.answerType === 'numeric' ? (
          <div>
            <label htmlFor="answer" className="text-sm text-ink-300">
              Tu respuesta
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="answer"
                value={value}
                autoComplete="off"
                onChange={(e) => {
                  setValue(e.target.value);
                  writeJson(draftKey, e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                placeholder="p. ej. 0.375 · 3/8 · 37.5%"
                className="w-64 rounded-md border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-violet"
              />
              <CheckButton onClick={check} />
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Se acepta con un margen de ±{formatNumber(problem.tolerance)}. Puedes escribir decimales, fracciones o porcentajes.
            </p>
          </div>
        ) : (
          <div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm text-ink-300">Elige la respuesta correcta</legend>
              {problem.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    choice === i ? 'border-violet bg-violet/10' : 'border-ink-700 bg-ink-900 hover:border-ink-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    checked={choice === i}
                    onChange={() => setChoice(i)}
                    className="mt-1 accent-violet-400"
                  />
                  <span className="font-mono text-xs text-ink-400">{String.fromCharCode(65 + i)}</span>
                  <div className="min-w-0 flex-1 text-sm">
                    <Markdown>{opt}</Markdown>
                  </div>
                </label>
              ))}
            </fieldset>
            <div className="mt-4">
              <CheckButton onClick={check} />
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-amber">{error}</p>}

        {result && (
          <div className="mt-5 space-y-4">
            {result.correct ? (
              <Banner tone="ok" title="✓ ¡Correcto!" />
            ) : (
              <Banner tone="bad" title="✗ No es correcto">
                <p className="text-xs">
                  Puedes volver a intentarlo, pedir una pista en la pestaña Pistas o ver la explicación completa.
                </p>
              </Banner>
            )}
            {!showExplanation ? (
              <button onClick={() => setShowExplanation(true)} className="text-sm text-sky hover:underline">
                Ver la respuesta y la explicación
              </button>
            ) : (
              <div className="rounded-lg border border-ink-700 bg-ink-900 p-4">
                <div className="mb-3 text-sm text-ink-100">
                  <span className="text-jade">Respuesta: </span>
                  {problem.answerType === 'numeric' ? (
                    <span className="font-mono">{formatNumber(problem.answer)}</span>
                  ) : (
                    <div className="mt-1 flex gap-2">
                      <span className="font-mono text-ink-400">{String.fromCharCode(65 + problem.answer)}.</span>
                      <Markdown>{problem.options[problem.answer]}</Markdown>
                    </div>
                  )}
                </div>
                <Markdown>{problem.explanation}</Markdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md bg-vermilion px-4 py-2 text-sm font-semibold text-ink-950 hover:brightness-110"
    >
      Comprobar
    </button>
  );
}
