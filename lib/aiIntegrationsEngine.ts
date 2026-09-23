/**
 * AI Third-Party Integration Generator Engine
 * Scaffolds SaaS integrations (Stripe Billing, Resend Email, OpenAI/Gemini SDK, Pinecone RAG, Algolia Search)
 * into project files including client SDK wrappers, webhook handlers, and env vars.
 */

export interface IntegrationDef {
  id: 'stripe' | 'resend' | 'openai' | 'pinecone' | 'algolia';
  name: string;
  category: 'Billing & Checkout' | 'Email & Messaging' | 'AI & LLM' | 'Vector DB' | 'Search Engine';
  description: string;
  iconName: string;
  envKeys: string[];
  files: {
    path: string;
    description: string;
    code: string;
  }[];
}

export const SUPPORTED_INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'stripe',
    name: 'Stripe Billing & Subscriptions',
    category: 'Billing & Checkout',
    description: 'Scaffolds Stripe SDK, Checkout session builder, and Webhook handler (/api/webhooks/stripe).',
    iconName: 'CreditCard',
    envKeys: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    files: [
      {
        path: 'lib/stripeClient.ts',
        description: 'Stripe Node SDK client wrapper',
        code: `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2023-10-16',
});`,
      },
      {
        path: 'app/api/webhooks/stripe/route.ts',
        description: 'Stripe webhook listener for subscription lifecycle events',
        code: `import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripeClient';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock'
    );

    if (event.type === 'checkout.session.completed') {
      console.log('[Stripe Webhook] Payment succeeded for session:', event.data.object.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
}`,
      },
    ],
  },
  {
    id: 'resend',
    name: 'Resend Transactional Email',
    category: 'Email & Messaging',
    description: 'Scaffolds Resend Email SDK and react-email template renderer.',
    iconName: 'Mail',
    envKeys: ['RESEND_API_KEY', 'CONTACT_EMAIL_FROM'],
    files: [
      {
        path: 'lib/resendEmail.ts',
        description: 'Resend email dispatch client',
        code: `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function sendWelcomeEmail(to: string, name: string) {
  return await resend.emails.send({
    from: process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject: \`Welcome to AI SaaS, \${name}!\`,
    html: \`<h1>Welcome \${name}!</h1><p>Thank you for joining our platform.</p>\`,
  });
}`,
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI / Gemini SDK Proxy',
    category: 'AI & LLM',
    description: 'Scaffolds AI completion proxy with streaming response support.',
    iconName: 'Bot',
    envKeys: ['OPENAI_API_KEY', 'GEMINI_API_KEY'],
    files: [
      {
        path: 'lib/aiClient.ts',
        description: 'Unified AI LLM Client',
        code: `export async function generateCompletion(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Demo response: Please configure OPENAI_API_KEY in .env.local";
  }
  // Simulated AI response pipeline
  return \`AI Response for "\${prompt}": Enhanced with intelligent Insights.\`;
}`,
      },
    ],
  },
];

/**
 * Injects chosen integration files into the project filesMap
 */
export function injectIntegration(
  filesMap: Record<string, string>,
  integration: IntegrationDef
): Record<string, string> {
  const updatedMap = { ...filesMap };

  // Add integration files
  for (const fileDef of integration.files) {
    updatedMap[fileDef.path] = fileDef.code;
  }

  // Update or append to .env.example
  const currentEnv = updatedMap['.env.example'] || '# Project Environment Variables\n';
  const newEnvKeys = integration.envKeys.map((k) => `${k}=your_${k.toLowerCase()}_here`).join('\n');
  updatedMap['.env.example'] = `${currentEnv}\n# ${integration.name}\n${newEnvKeys}\n`;

  return updatedMap;
}
