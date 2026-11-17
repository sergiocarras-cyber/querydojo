import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { useRef } from 'react';

interface Props {
  language: 'sql' | 'python';
  value: string;
  onChange: (value: string) => void;
  /** Called on Cmd/Ctrl+Enter. */
  onRun?: () => void;
  /** Called on Cmd/Ctrl+Shift+Enter. */
  onSubmit?: () => void;
}

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('querydojo', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5d6679', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff6b4a' },
      { token: 'string', foreground: '3ddc97' },
      { token: 'number', foreground: 'f5b84a' },
      { token: 'operator', foreground: 'a7b0c3' },
      { token: 'predefined', foreground: '6cb6ff' },
      { token: 'type', foreground: 'b18cff' },
    ],
    colors: {
      'editor.background': '#0b0d10',
      'editor.foreground': '#e7ebf2',
      'editorLineNumber.foreground': '#343b4b',
      'editorLineNumber.activeForeground': '#a7b0c3',
      'editor.lineHighlightBackground': '#151922',
      'editor.selectionBackground': '#ff6b4a40',
      'editorCursor.foreground': '#ff6b4a',
      'editorIndentGuide.background1': '#1a1f29',
      'editorWidget.background': '#11141a',
      'editorWidget.border': '#252b38',
    },
  });
};

export function CodeEditor({ language, value, onChange, onRun, onSubmit }: Props) {
  // Keep the latest callbacks reachable from the commands registered once on mount.
  const handlers = useRef({ onRun, onSubmit });
  handlers.current = { onRun, onSubmit };

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handlers.current.onRun?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () =>
      handlers.current.onSubmit?.(),
    );
    editor.focus();
  };

  return (
    <Editor
      language={language}
      value={value}
      theme="querydojo"
      beforeMount={defineTheme}
      onMount={onMount}
      onChange={(v) => onChange(v ?? '')}
      loading={<div className="p-4 font-mono text-xs text-ink-500">Cargando editor…</div>}
      options={{
        fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: language === 'python' ? 4 : 2,
        insertSpaces: true,
        padding: { top: 12 },
        renderLineHighlight: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        fixedOverflowWidgets: true,
      }}
    />
  );
}
