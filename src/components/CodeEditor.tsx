import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { useRef } from 'react';
import { useTheme } from '../lib/theme';

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
  monaco.editor.defineTheme('querydojo-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6c6c74', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7a5c' },
      { token: 'string', foreground: '7ee08f' },
      { token: 'number', foreground: 'ffb340' },
      { token: 'operator', foreground: 'bcbcc3' },
      { token: 'predefined', foreground: '6cb4ff' },
      { token: 'type', foreground: 'd19bff' },
    ],
    colors: {
      'editor.background': '#0a0a0c',
      'editor.foreground': '#f5f5f7',
      'editorLineNumber.foreground': '#3d3d43',
      'editorLineNumber.activeForeground': '#98989f',
      'editor.lineHighlightBackground': '#16161a',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#ff6b4a3d',
      'editorCursor.foreground': '#ff6b4a',
      'editorIndentGuide.background1': '#1e1e22',
      'editorWidget.background': '#1a1a1d',
      'editorWidget.border': '#2d2d31',
      'scrollbarSlider.background': '#ffffff14',
      'scrollbarSlider.hoverBackground': '#ffffff24',
    },
  });
  monaco.editor.defineTheme('querydojo-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a8a91', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c8391a' },
      { token: 'string', foreground: '1a7f37' },
      { token: 'number', foreground: '9a5b00' },
      { token: 'operator', foreground: '48484e' },
      { token: 'predefined', foreground: '0a5fc2' },
      { token: 'type', foreground: '7b3fb3' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1d1d1f',
      'editorLineNumber.foreground': '#c8c8ce',
      'editorLineNumber.activeForeground': '#6b6b72',
      'editor.lineHighlightBackground': '#f5f5f7',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#ec4f2b2e',
      'editorCursor.foreground': '#ec4f2b',
      'editorIndentGuide.background1': '#ededf0',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#dedee3',
      'scrollbarSlider.background': '#0000001a',
      'scrollbarSlider.hoverBackground': '#0000002b',
    },
  });
};

export function CodeEditor({ language, value, onChange, onRun, onSubmit }: Props) {
  // Keep the latest callbacks reachable from the commands registered once on mount.
  const { resolved } = useTheme();
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
      theme={resolved === 'light' ? 'querydojo-light' : 'querydojo-dark'}
      beforeMount={defineTheme}
      onMount={onMount}
      onChange={(v) => onChange(v ?? '')}
      loading={<div className="p-5 text-[13px] text-ink-500">Cargando editor…</div>}
      options={{
        fontFamily: "ui-monospace, 'SF Mono', 'JetBrains Mono Variable', Menlo, monospace",
        fontSize: 13,
        lineHeight: 21,
        fontLigatures: false,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        roundedSelection: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: language === 'python' ? 4 : 2,
        insertSpaces: true,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        fixedOverflowWidgets: true,
      }}
    />
  );
}
