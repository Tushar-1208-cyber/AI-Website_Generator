/**
 * Git Version Control & Branching Agent Engine
 * Manages virtual Git history, commit graph snapshots, feature branches,
 * commit rollbacks, and line-by-line file diffing in the playground.
 */

export interface VirtualCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesSnapshot: Record<string, string>;
  branch: string;
}

export interface VirtualBranch {
  name: string;
  isCurrent: boolean;
  headCommitHash: string;
}

export interface FileDiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface FileDiffResult {
  fileName: string;
  lines: FileDiffLine[];
  additions: number;
  deletions: number;
}

export const INITIAL_BRANCHES: VirtualBranch[] = [
  { name: 'main', isCurrent: true, headCommitHash: 'a8f8ab8' },
  { name: 'feature/auth-redesign', isCurrent: false, headCommitHash: 'fa2bebf' },
  { name: 'feature/stripe-integration', isCurrent: false, headCommitHash: 'c02ed35' },
];

export const INITIAL_COMMITS: VirtualCommit[] = [
  {
    id: 'commit-14',
    hash: 'a8f8ab8',
    message: 'feat(database): integrate AI Database button and modal into playground UI',
    author: 'AI Agent <agent@antigravity.ai>',
    timestamp: 'Just now',
    filesSnapshot: {},
    branch: 'main',
  },
  {
    id: 'commit-13',
    hash: 'c02ed35',
    message: 'feat(integrations): integrate AI Integrations button and modal into playground UI',
    author: 'AI Agent <agent@antigravity.ai>',
    timestamp: '5 minutes ago',
    filesSnapshot: {},
    branch: 'main',
  },
  {
    id: 'commit-12',
    hash: 'fa2bebf',
    message: 'feat(auth): integrate AI Auth button and modal into playground UI',
    author: 'AI Agent <agent@antigravity.ai>',
    timestamp: '12 minutes ago',
    filesSnapshot: {},
    branch: 'main',
  },
];

/**
 * Calculates a line-by-line diff between two file content strings.
 */
export function computeFileDiff(fileName: string, oldText: string, newText: string): FileDiffResult {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  const lines: FileDiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let additions = 0;
  let deletions = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldLine === newLine && oldLine !== undefined) {
      lines.push({
        type: 'unchanged',
        content: oldLine,
        oldLineNum: oldIdx + 1,
        newLineNum: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else {
      if (oldLine !== undefined) {
        lines.push({
          type: 'removed',
          content: oldLine,
          oldLineNum: oldIdx + 1,
        });
        deletions++;
        oldIdx++;
      }
      if (newLine !== undefined) {
        lines.push({
          type: 'added',
          content: newLine,
          newLineNum: newIdx + 1,
        });
        additions++;
        newIdx++;
      }
    }
  }

  return {
    fileName,
    lines,
    additions,
    deletions,
  };
}

/**
 * Creates a new virtual commit in the version history tree
 */
export function createVirtualCommit(
  history: VirtualCommit[],
  currentBranch: string,
  message: string,
  filesMap: Record<string, string>
): { updatedHistory: VirtualCommit[]; newCommit: VirtualCommit } {
  const hash = Math.random().toString(36).substring(2, 9);
  const newCommit: VirtualCommit = {
    id: `commit-${Date.now()}`,
    hash,
    message: message || 'Update project files',
    author: 'Developer <user@antigravity.ai>',
    timestamp: 'Just now',
    filesSnapshot: { ...filesMap },
    branch: currentBranch,
  };

  return {
    updatedHistory: [newCommit, ...history],
    newCommit,
  };
}
