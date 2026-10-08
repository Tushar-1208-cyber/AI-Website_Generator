"use client";

import React, { useRef, useEffect, useState } from "react";
import Editor, { DiffEditor, useMonaco } from "@monaco-editor/react";
import { getMonacoLanguage } from "@/lib/monacoLanguageDetector";
import { Code2, GitCompare, Check, X, AlertCircle } from "lucide-react";
import { DetectedIssue } from "@/lib/errorDetectionEngine";

interface MonacoCodeEditorProps {
  filePath: string;
  value: string;
  onChange: (newValue: string) => void;
  onCommit?: (newValue: string) => void;
  issues?: DetectedIssue[];
  diffOriginalValue?: string | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
}

export default function MonacoCodeEditor({
  filePath,
  value,
  onChange,
  onCommit,
  issues = [],
  diffOriginalValue = null,
  onAcceptDiff,
  onRejectDiff,
}: MonacoCodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const language = getMonacoLanguage(filePath);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Set up Error Markers when monaco & issues change
  useEffect(() => {
    if (!monaco || !editorRef.current) return;

    try {
      const model = editorRef.current.getModel();
      if (!model) return;

      const markers = issues
        .filter((issue) => issue.file === filePath)
        .map((issue) => ({
          startLineNumber: issue.line || 1,
          startColumn: 1,
          endLineNumber: issue.line || 1,
          endColumn: 100,
          message: `${issue.title}: ${issue.description}`,
          severity:
            issue.severity === "error"
              ? monaco.MarkerSeverity.Error
              : issue.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        }));

      monaco.editor.setModelMarkers(model, "errorDetectionEngine", markers);
    } catch (err) {
      console.warn("Failed to set Monaco markers:", err);
    }
  }, [monaco, issues, filePath, value]);

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;

    // Configure editor shortcuts and options
    editor.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  const handleEditorChange = (val: string | undefined) => {
    const updated = val ?? "";
    onChange(updated);
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-0 min-w-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Optional AI Diff Header Banner */}
      {diffOriginalValue !== null && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/90 border-b border-blue-800 text-blue-200 text-xs font-sans shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <GitCompare className="size-4 text-blue-400" />
            <span>AI Code Diff Review ({filePath})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRejectDiff}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1 transition-all"
            >
              <X className="size-3.5" /> Reject
            </button>
            <button
              onClick={onAcceptDiff}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
            >
              <Check className="size-3.5" /> Apply Patch
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Content */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
        {editorError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-400 gap-3 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-xs font-medium text-slate-300">Failed to load Monaco Code Editor.</p>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={(e) => onCommit?.(e.target.value)}
              className="w-full max-w-2xl h-64 bg-slate-900 border border-slate-800 text-slate-200 p-3 rounded-xl font-mono text-xs focus:outline-none"
            />
          </div>
        ) : diffOriginalValue !== null ? (
          <DiffEditor
            height="100%"
            language={language}
            original={diffOriginalValue}
            modified={value}
            theme="vs-dark"
            options={{
              readOnly: false,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          <Editor
            height="100%"
            path={filePath}
            language={language}
            value={value}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            loading={
              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 gap-2 text-xs font-mono">
                <Code2 className="size-4 animate-spin text-blue-500" />
                <span>Loading Monaco IDE Editor...</span>
              </div>
            }
            options={{
              fontSize: 13,
              fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, monospace",
              lineNumbers: "on",
              renderLineHighlight: "all",
              minimap: { enabled: true, side: "right" },
              wordWrap: "on",
              wrappingIndent: "indent",
              tabSize: 2,
              insertSpaces: true,
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              matchBrackets: "always",
              folding: true,
              smoothScrolling: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: "never",
                seedSearchStringFromSelection: "always",
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
