/**
 * lib/aiResponseSchema.ts
 * Response schema validation, sanitization, and parsing utility for AI outputs.
 * Handles path traversal defense, JSON chunk extraction, and fallback parsing.
 */

import { AIPatchPayload, PatchOperation } from './aiPatchEngine';
import { parseMultiFiles } from './fileTree';

/**
 * Strips path traversal sequences (e.g. ../, ..\, leading / or \) and normalizes path.
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath) return '';
  return filePath
    .replace(/(\.\.[\/\\])+/g, '') // remove relative parent directory navigation
    .replace(/^[/\\]+/, '')        // remove leading slashes
    .trim();
}

/**
 * Extracts and cleans JSON blocks from raw LLM text stream or response.
 */
export function extractJSONFromText(text: string): any | null {
  if (!text) return null;

  // 1. Try direct JSON parse
  try {
    return JSON.parse(text.trim());
  } catch {
    // Continue to block extraction
  }

  // 2. Try extracting from ```json ... ``` code blocks
  const jsonBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i;
  const match = jsonBlockRegex.exec(text);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      // Ignore parse error
    }
  }

  // 3. Try finding first '{' and last '}'
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx > startIdx) {
    try {
      const candidate = text.slice(startIdx, endIdx + 1);
      return JSON.parse(candidate);
    } catch {
      // Ignore parse error
    }
  }

  return null;
}

/**
 * Sanitizes and validates an AIPatchPayload object, cleaning all target file paths.
 */
export function sanitizePatchPayload(payload: any): AIPatchPayload | null {
  if (!payload || typeof payload !== 'object') return null;

  const type = payload.type === 'patch' ? 'patch' : 'full';
  const summary = typeof payload.summary === 'string' ? payload.summary : undefined;

  let operations: PatchOperation[] | undefined;
  if (Array.isArray(payload.operations)) {
    operations = payload.operations
      .map((op: any): PatchOperation | null => {
        if (!op || typeof op !== 'object' || typeof op.op !== 'string' || typeof op.file !== 'string') {
          return null;
        }

        const sanitizedFile = sanitizeFilePath(op.file);
        if (!sanitizedFile) return null;

        const cleanOp: PatchOperation = {
          op: op.op as any,
          file: sanitizedFile,
          reason: typeof op.reason === 'string' ? op.reason : undefined,
        };

        if (op.newFile && typeof op.newFile === 'string') {
          cleanOp.newFile = sanitizeFilePath(op.newFile);
        }

        if (op.content && typeof op.content === 'string') {
          cleanOp.content = op.content;
        }

        if (Array.isArray(op.changes)) {
          cleanOp.changes = op.changes
            .filter((c: any) => c && typeof c.search === 'string' && typeof c.replace === 'string')
            .map((c: any) => ({
              search: c.search,
              replace: c.replace,
            }));
        }

        return cleanOp;
      })
      .filter((op: PatchOperation | null): op is PatchOperation => op !== null);
  }

  let files: Record<string, string> | undefined;
  if (payload.files && typeof payload.files === 'object') {
    files = {};
    for (const [key, val] of Object.entries(payload.files)) {
      if (typeof val === 'string') {
        const cleanKey = sanitizeFilePath(key);
        if (cleanKey) {
          files[cleanKey] = val;
        }
      }
    }
  }

  return {
    type,
    summary,
    operations,
    files,
  };
}

/**
 * Main parser utility: Parses stream/raw text into AIPatchPayload or falls back to parseMultiFiles.
 */
export function parseAIResponseToPatch(
  rawResponse: string,
  existingFiles?: Record<string, string>
): AIPatchPayload {
  // 1. Attempt JSON patch extraction
  const jsonObj = extractJSONFromText(rawResponse);
  if (jsonObj) {
    const sanitized = sanitizePatchPayload(jsonObj);
    if (sanitized && ((sanitized.operations && sanitized.operations.length > 0) || (sanitized.files && Object.keys(sanitized.files).length > 0))) {
      return sanitized;
    }
  }

  // 2. Fallback: Parse classic XML file blocks (<file path="...">...</file>) or code fences
  const parsedFiles = parseMultiFiles(rawResponse);
  if (Object.keys(parsedFiles).length > 0) {
    const sanitizedFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(parsedFiles)) {
      const cleanPath = sanitizeFilePath(path);
      if (cleanPath) {
        sanitizedFiles[cleanPath] = content;
      }
    }

    return {
      type: 'full',
      summary: 'Parsed full file structures from AI response.',
      files: sanitizedFiles,
    };
  }

  // 3. Last fallback: single file target (e.g. index.html)
  return {
    type: 'full',
    summary: 'Fallback single file payload.',
    files: {
      'index.html': rawResponse,
    },
  };
}
