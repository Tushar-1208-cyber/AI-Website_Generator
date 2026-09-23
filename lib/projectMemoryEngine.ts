/**
 * Long-Term AI Project Memory & Architecture Rules Engine
 * Persists project architectural decisions, brand guidelines, coding conventions,
 * and tech stack constraints across AI generations.
 */

export interface MemoryItem {
  id: string;
  category: 'stack' | 'design' | 'api' | 'security' | 'custom';
  title: string;
  rule: string;
  pinned: boolean;
  createdAt: string;
}

export const INITIAL_PROJECT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-101',
    category: 'design',
    title: 'Tailwind Dark Mode Standard',
    rule: 'Always render dark mode background `bg-slate-900` or `bg-slate-950` with `text-slate-100` readability.',
    pinned: true,
    createdAt: 'Project Init',
  },
  {
    id: 'mem-102',
    category: 'stack',
    title: 'Icons Library Directive',
    rule: 'Only import standard valid icons from `lucide-react`. Ensure every icon is explicitly declared in import statement.',
    pinned: true,
    createdAt: 'Project Init',
  },
  {
    id: 'mem-103',
    category: 'api',
    title: 'Next.js App Router API Convention',
    rule: 'Scaffold serverless routes inside `app/api/[path]/route.ts` using `NextResponse.json()` responses.',
    pinned: true,
    createdAt: 'Project Init',
  },
  {
    id: 'mem-104',
    category: 'security',
    title: 'Strict Input Guardrails',
    rule: 'Validate JSON request bodies, enforce HttpOnly auth cookies, and sanitize string inputs against XSS.',
    pinned: false,
    createdAt: 'Project Init',
  },
];

/**
 * Formats pinned project memories into structured AI system prompt instructions.
 */
export function buildMemoryPromptContext(memories: MemoryItem[]): string {
  const activeRules = memories.filter((m) => m.pinned);
  if (activeRules.length === 0) return '';

  let context = `\n[PROJECT ARCHITECTURE MEMORY & RULES]\n`;
  for (const m of activeRules) {
    context += `- [${m.category.toUpperCase()}] ${m.title}: ${m.rule}\n`;
  }

  return context;
}

export function addMemoryRule(
  memories: MemoryItem[],
  category: MemoryItem['category'],
  title: string,
  rule: string
): MemoryItem[] {
  const newItem: MemoryItem = {
    id: `mem-${Date.now()}`,
    category,
    title,
    rule,
    pinned: true,
    createdAt: 'Just now',
  };
  return [newItem, ...memories];
}
