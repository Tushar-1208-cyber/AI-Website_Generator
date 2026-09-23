/**
 * Multiplayer Real-Time Collaboration System Engine
 * Manages live multiplayer room presence, active teammate cursors,
 * room invitation links, and element/code comment threads.
 */

export interface Teammate {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'idle' | 'offline';
  currentLocation: string; // e.g. 'Editing index.html:L42'
}

export interface CommentThread {
  id: string;
  author: string;
  authorAvatar: string;
  targetFile: string;
  lineNum?: number;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: { author: string; text: string; createdAt: string }[];
}

export const DEMO_TEAMMATES: Teammate[] = [
  {
    id: 'usr-1',
    name: 'You (Owner)',
    email: 'developer@antigravity.ai',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    color: '#3b82f6',
    role: 'admin',
    status: 'active',
    currentLocation: 'Playground Studio',
  },
  {
    id: 'usr-2',
    name: 'Sarah Chen (Lead Designer)',
    email: 'sarah@design.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    color: '#ec4899',
    role: 'editor',
    status: 'active',
    currentLocation: 'Inspecting Hero Section',
  },
  {
    id: 'usr-3',
    name: 'Alex Rivera (Backend Dev)',
    email: 'alex@dev.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    color: '#10b981',
    role: 'editor',
    status: 'idle',
    currentLocation: 'Editing app/api/contact/route.ts',
  },
];

export const DEMO_COMMENTS: CommentThread[] = [
  {
    id: 'cmt-101',
    author: 'Sarah Chen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    targetFile: 'index.html',
    lineNum: 15,
    text: 'Let us update this hero CTA gradient to match our Cyberpunk Neon design system preset.',
    createdAt: '10 mins ago',
    resolved: false,
    replies: [
      {
        author: 'Alex Rivera',
        text: 'Agreed! I will apply the primary indigo-600 token.',
        createdAt: '5 mins ago',
      },
    ],
  },
];

export function generateRoomShareUrl(roomId = 'room_ai_saas_772'): string {
  return `https://aisaas.app/playground?room=${roomId}&key=inv_${Math.random().toString(36).substring(2, 8)}`;
}

export function addCommentThread(
  threads: CommentThread[],
  targetFile: string,
  text: string,
  author = 'You (Owner)'
): CommentThread[] {
  const newComment: CommentThread = {
    id: `cmt-${Date.now()}`,
    author,
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    targetFile,
    text,
    createdAt: 'Just now',
    resolved: false,
    replies: [],
  };
  return [newComment, ...threads];
}
