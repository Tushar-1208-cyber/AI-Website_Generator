/**
 * lib/aiPatchEngine.ts
 * Safe application of targeted AI diff/patch operations.
 * Handles single-occurrence search/replace validation, ambiguity detection,
 * line ending normalization, and multi-operation file patching.
 */

export type PatchOperationType =
  | 'PATCH_FILE'
  | 'CREATE_FILE'
  | 'DELETE_FILE'
  | 'RENAME_FILE'
  | 'UPDATE_FILE'
  | 'NO_CHANGE';

export interface FileChange {
  search: string;
  replace: string;
}

export interface PatchOperation {
  op: PatchOperationType;
  file: string;
  newFile?: string;
  changes?: FileChange[];
  content?: string;
  reason?: string;
}

export interface AIPatchPayload {
  type: 'patch' | 'full';
  summary?: string;
  operations?: PatchOperation[];
  files?: Record<string, string>;
}

export interface PatchApplyResult {
  success: boolean;
  files: Record<string, string>;
  appliedOps: number;
  failedOps: number;
  errors: string[];
  fallbackUsed: boolean;
}

/**
 * Normalizes line endings to \n for consistent search matching.
 */
function normalizeLineEndings(str: string): string {
  return str.replace(/\r\n/g, '\n');
}

/**
 * Counts occurrences of a target substring in a given source string.
 */
function countOccurrences(source: string, target: string): number {
  if (!target) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = source.indexOf(target, pos)) !== -1) {
    count++;
    pos += target.length;
  }
  return count;
}

/**
 * Applies a list of search/replace changes to a single file's content.
 */
export function applyFilePatch(
  originalContent: string,
  changes: FileChange[]
): { updatedContent: string; success: boolean; errors: string[] } {
  let content = normalizeLineEndings(originalContent);
  const errors: string[] = [];
  let success = true;

  for (let i = 0; i < changes.length; i++) {
    const { search, replace } = changes[i];
    const normSearch = normalizeLineEndings(search);
    const normReplace = normalizeLineEndings(replace);

    if (!normSearch) {
      errors.push(`Change index ${i}: Empty search string provided.`);
      success = false;
      continue;
    }

    if (normSearch === normReplace) {
      // No-op change, safe to skip
      continue;
    }

    let occ = countOccurrences(content, normSearch);

    // Fallback: If exact match fails, try trimming trailing whitespace on lines
    if (occ === 0) {
      const trimmedSearch = normSearch.trim();
      if (trimmedSearch) {
        occ = countOccurrences(content, trimmedSearch);
        if (occ === 1) {
          content = content.replace(trimmedSearch, normReplace.trim());
          continue;
        }
      }
    }

    if (occ === 0) {
      errors.push(`Change index ${i}: Search block not found in file.`);
      success = false;
    } else if (occ > 1) {
      errors.push(`Change index ${i}: Ambiguous search block found ${occ} times in file.`);
      success = false;
    } else {
      // Exactly 1 occurrence found
      content = content.replace(normSearch, normReplace);
    }
  }

  return { updatedContent: content, success, errors };
}

/**
 * Normalizes file path strings (removing leading slashes or relative prefixes).
 */
export function normalizeFilePath(pathStr: string): string {
  if (!pathStr) return '';
  return pathStr.replace(/^[/\\]+/, '').trim();
}

/**
 * Finds a matching key in filesMap accounting for case-sensitivity or leading slashes.
 */
function findFileKey(filesMap: Record<string, string>, targetPath: string): string | null {
  const normTarget = normalizeFilePath(targetPath);
  if (filesMap[normTarget] !== undefined) return normTarget;
  if (filesMap[targetPath] !== undefined) return targetPath;

  const targetLower = normTarget.toLowerCase();
  for (const key of Object.keys(filesMap)) {
    if (normalizeFilePath(key).toLowerCase() === targetLower) {
      return key;
    }
  }
  return null;
}

/**
 * Validates and applies a full AIPatchPayload to a copy of the project's filesMap.
 */
export function validateAndApplyPatch(
  currentFiles: Record<string, string>,
  patchPayload: AIPatchPayload
): PatchApplyResult {
  const newFiles: Record<string, string> = { ...currentFiles };
  const errors: string[] = [];
  let appliedOps = 0;
  let failedOps = 0;
  let fallbackUsed = false;

  // Handle direct full file generation
  if (patchPayload.type === 'full' && patchPayload.files) {
    for (const [filePath, content] of Object.entries(patchPayload.files)) {
      const key = findFileKey(newFiles, filePath) || normalizeFilePath(filePath);
      newFiles[key] = content;
    }
    return {
      success: true,
      files: newFiles,
      appliedOps: Object.keys(patchPayload.files).length,
      failedOps: 0,
      errors: [],
      fallbackUsed: true,
    };
  }

  const ops = patchPayload.operations || [];
  if (ops.length === 0 && (!patchPayload.files || Object.keys(patchPayload.files).length === 0)) {
    return {
      success: true,
      files: newFiles,
      appliedOps: 0,
      failedOps: 0,
      errors: ['No operations or files supplied in payload.'],
      fallbackUsed: false,
    };
  }

  for (const op of ops) {
    const targetKey = findFileKey(newFiles, op.file) || normalizeFilePath(op.file);

    switch (op.op) {
      case 'PATCH_FILE': {
        const fileContent = newFiles[targetKey];
        if (fileContent === undefined) {
          errors.push(`PATCH_FILE failed: File "${op.file}" does not exist.`);
          failedOps++;
          break;
        }

        if (!op.changes || op.changes.length === 0) {
          errors.push(`PATCH_FILE failed: No changes specified for file "${op.file}".`);
          failedOps++;
          break;
        }

        const patchRes = applyFilePatch(fileContent, op.changes);
        if (patchRes.success) {
          newFiles[targetKey] = patchRes.updatedContent;
          appliedOps++;
        } else {
          errors.push(`PATCH_FILE failed for "${op.file}": ${patchRes.errors.join(' | ')}`);
          failedOps++;
        }
        break;
      }

      case 'CREATE_FILE':
      case 'UPDATE_FILE': {
        newFiles[targetKey] = op.content || '';
        appliedOps++;
        break;
      }

      case 'DELETE_FILE': {
        if (newFiles[targetKey] !== undefined) {
          delete newFiles[targetKey];
          appliedOps++;
        } else {
          errors.push(`DELETE_FILE warning: File "${op.file}" was already absent.`);
          appliedOps++;
        }
        break;
      }

      case 'RENAME_FILE': {
        if (!op.newFile) {
          errors.push(`RENAME_FILE failed: Target newFile path not specified.`);
          failedOps++;
          break;
        }
        const newKey = normalizeFilePath(op.newFile);
        if (newFiles[targetKey] !== undefined) {
          newFiles[newKey] = newFiles[targetKey];
          delete newFiles[targetKey];
          appliedOps++;
        } else {
          errors.push(`RENAME_FILE failed: Source file "${op.file}" does not exist.`);
          failedOps++;
        }
        break;
      }

      case 'NO_CHANGE': {
        appliedOps++;
        break;
      }

      default: {
        errors.push(`Unknown patch operation type: ${(op as any).op}`);
        failedOps++;
      }
    }
  }

  // If any operations failed but full files fallback is available in payload, use it
  let overallSuccess = failedOps === 0;
  if (!overallSuccess && patchPayload.files && Object.keys(patchPayload.files).length > 0) {
    for (const [filePath, content] of Object.entries(patchPayload.files)) {
      const key = findFileKey(newFiles, filePath) || normalizeFilePath(filePath);
      newFiles[key] = content;
    }
    fallbackUsed = true;
    overallSuccess = true;
  }

  return {
    success: overallSuccess,
    files: newFiles,
    appliedOps,
    failedOps,
    errors,
    fallbackUsed,
  };
}

/**
 * Type guard to check if an arbitrary object matches AIPatchPayload interface.
 */
export function isPatchPayload(obj: any): obj is AIPatchPayload {
  if (!obj || typeof obj !== 'object') return false;
  return (
    (obj.type === 'patch' || obj.type === 'full') &&
    (Array.isArray(obj.operations) || typeof obj.files === 'object')
  );
}
