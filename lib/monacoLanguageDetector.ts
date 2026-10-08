/**
 * lib/monacoLanguageDetector.ts
 * Utility to map file path extensions to Monaco Editor language IDs.
 */

export function getMonacoLanguage(filePath: string): string {
  if (!filePath) return "plaintext";

  const ext = filePath.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "scss":
    case "sass":
      return "scss";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "jsx":
      return "javascript";
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "svg":
    case "xml":
      return "xml";
    case "py":
      return "python";
    case "sh":
    case "bash":
      return "shell";
    case "yaml":
    case "yml":
      return "yaml";
    case "sql":
      return "sql";
    default:
      return "plaintext";
  }
}
