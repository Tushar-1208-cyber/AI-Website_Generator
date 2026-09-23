/**
 * AI Backend Engine
 * Scaffolds, validates, and simulates Next.js API routes & serverless endpoints
 * (Auth, CRUD, Contact Form, Stripe Checkout, AI Proxy).
 */

export interface ApiEndpoint {
  id: string;
  path: string; // e.g. /api/contact
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  title: string;
  description: string;
  category: 'auth' | 'form' | 'db' | 'payment' | 'ai';
  samplePayload?: Record<string, unknown>;
  codeSnippet: string;
}

export const PRESET_BACKEND_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'ep-contact',
    path: '/api/contact',
    method: 'POST',
    title: 'Contact Form Handler',
    description: 'Validates input, sends email notification via Resend/SendGrid, and logs lead in DB.',
    category: 'form',
    samplePayload: { name: 'John Doe', email: 'john@example.com', message: 'Hello AI Builder!' },
    codeSnippet: `import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!email || !message) {
      return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
    }
    // Simulate email dispatch & persistence
    console.log("[API /api/contact] Received message from:", email);
    return NextResponse.json({ success: true, message: "Contact request submitted successfully!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}`,
  },
  {
    id: 'ep-auth-login',
    path: '/api/auth/login',
    method: 'POST',
    title: 'JWT User Login',
    description: 'Authenticates credentials, generates JWT access token, and sets secure HttpOnly cookie.',
    category: 'auth',
    samplePayload: { email: 'user@company.com', password: '••••••••' },
    codeSnippet: `import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (email === "demo@ai.com" && password === "password123") {
    return NextResponse.json({
      success: true,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      user: { id: "usr_101", email, name: "Demo User", role: "admin" }
    });
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}`,
  },
  {
    id: 'ep-stripe-checkout',
    path: '/api/checkout/stripe',
    method: 'POST',
    title: 'Stripe Checkout Session',
    description: 'Creates a Stripe payment checkout session URL for SaaS subscriptions or one-time purchases.',
    category: 'payment',
    samplePayload: { priceId: 'price_1Nxxx', successUrl: '/success', cancelUrl: '/pricing' },
    codeSnippet: `import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { priceId, successUrl } = await req.json();
  // Scaffolds Stripe payment session
  return NextResponse.json({
    sessionId: "cs_test_a1b2c3d4e5",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5"
  });
}`,
  },
  {
    id: 'ep-ai-completion',
    path: '/api/ai/generate',
    method: 'POST',
    title: 'LLM Proxy & Stream Generator',
    description: 'Proxies requests to OpenAI/Gemini with rate-limiting & prompt guardrails.',
    category: 'ai',
    samplePayload: { prompt: 'Generate SaaS headline slogan', model: 'gemini-2.5-flash' },
    codeSnippet: `import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  return NextResponse.json({
    result: "Automate Your Workflow with Next-Gen AI Power",
    tokensUsed: 42
  });
}`,
  },
];

/**
 * Automatically creates API route files inside the project filesMap
 */
export function scaffoldBackendEndpoint(
  filesMap: Record<string, string>,
  endpoint: ApiEndpoint
): Record<string, string> {
  const routePath = `app${endpoint.path}/route.ts`;
  return {
    ...filesMap,
    [routePath]: endpoint.codeSnippet,
  };
}

/**
 * Simulates calling an API endpoint with a sample payload
 */
export async function simulateEndpointCall(
  endpoint: ApiEndpoint,
  payload: Record<string, unknown>
): Promise<{ status: number; data: unknown; latencyMs: number }> {
  const startTime = Date.now();
  await new Promise((res) => setTimeout(res, 300)); // simulate latency

  const latencyMs = Date.now() - startTime;

  if (endpoint.path === '/api/auth/login') {
    if (payload.email === 'demo@ai.com' && payload.password === 'password123') {
      return {
        status: 200,
        data: { success: true, token: 'mock_jwt_token_9982', user: { email: payload.email, role: 'admin' } },
        latencyMs,
      };
    }
  }

  return {
    status: 200,
    data: { success: true, message: `Successfully simulated ${endpoint.method} ${endpoint.path}`, echoPayload: payload },
    latencyMs,
  };
}
