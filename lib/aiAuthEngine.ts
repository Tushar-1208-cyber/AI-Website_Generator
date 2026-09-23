/**
 * AI Authentication Engine
 * Generates ready-to-use Auth integration blueprints (Clerk, Supabase, NextAuth, Firebase, JWT)
 * and injects login/signup forms, OAuth buttons, and protected route handlers into project files.
 */

export type AuthProvider = 'clerk' | 'supabase' | 'nextauth' | 'firebase' | 'custom_jwt';

export interface AuthConfig {
  provider: AuthProvider;
  enableGoogleOAuth: boolean;
  enableGithubOAuth: boolean;
  requireEmailVerification: boolean;
}

export interface AuthSnippet {
  title: string;
  description: string;
  targetFile: string;
  code: string;
}

/**
 * Generates auth integration code snippets based on configuration.
 */
export function generateAuthSnippets(config: AuthConfig): AuthSnippet[] {
  const snippets: AuthSnippet[] = [];

  if (config.provider === 'clerk') {
    snippets.push({
      title: 'Clerk Provider Wrapper',
      description: 'Wraps your application with ClerkProvider for seamless session management.',
      targetFile: 'app/layout.tsx',
      code: `import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="flex justify-between items-center p-4 border-b">
            <h1 className="font-bold text-lg">My AI App</h1>
            <SignedOut>
              <SignInButton mode="modal" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm" />
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}`,
    });

    snippets.push({
      title: 'Protected Route Middleware',
      description: 'Secures dashboard and API routes from unauthenticated access.',
      targetFile: 'middleware.ts',
      code: `import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/public"],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};`,
    });
  } else if (config.provider === 'supabase') {
    snippets.push({
      title: 'Supabase Client & Auth Helper',
      description: 'Initializes Supabase browser client for email/password and OAuth sign in.',
      targetFile: 'lib/supabaseClient.ts',
      code: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  return await supabase.auth.signOut();
}`,
    });
  } else {
    // Custom JWT or NextAuth
    snippets.push({
      title: 'Custom JWT Auth Component',
      description: 'Clean UI component for Login & Signup modal with JWT localStorage persistence.',
      targetFile: 'components/AuthModal.tsx',
      code: `'use client';
import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      alert('Sign in successful!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-white">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}`,
    });
  }

  return snippets;
}

/**
 * Injects Auth snippets into filesMap
 */
export function injectAuthIntoProject(
  filesMap: Record<string, string>,
  config: AuthConfig
): Record<string, string> {
  const snippets = generateAuthSnippets(config);
  const updated = { ...filesMap };

  for (const snippet of snippets) {
    updated[snippet.targetFile] = snippet.code;
  }

  return updated;
}
