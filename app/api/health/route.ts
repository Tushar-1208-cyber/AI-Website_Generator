// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();

    // Check critical environment configuration presence safely
    const envCheck = {
      geminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      clerkAuth: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      databaseUrl: Boolean(process.env.DATABASE_URL),
    };

    const isHealthy = envCheck.geminiApiKey;

    const healthData = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latencyMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      system: {
        memoryUsage: {
          rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        },
      },
      services: {
        geminiAI: envCheck.geminiApiKey ? "configured" : "missing_key",
        clerkAuth: envCheck.clerkAuth ? "configured" : "missing_key",
        database: envCheck.databaseUrl ? "configured" : "missing_url",
      },
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
