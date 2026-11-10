import { NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seoAuditEngine";
import { runAccessibilityAudit } from "@/lib/accessibilityAuditEngine";
import { runProjectPerformanceAudit } from "@/lib/performanceAuditEngine";
import {
  getAuthenticatedUser,
  safeErrorResponse,
  FilesMapSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const AuditRequestSchema = z.object({
  filesMap: FilesMapSchema,
});

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in to run audits.", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload.", 400);
    }

    const parseResult = AuditRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data.";
      return safeErrorResponse(firstError, 400);
    }

    const { filesMap } = parseResult.data;

    const seoReport = runSeoAudit(filesMap);
    const accessibilityReport = runAccessibilityAudit(filesMap);
    const performanceReport = runProjectPerformanceAudit(filesMap);

    return NextResponse.json({
      success: true,
      seo: seoReport,
      accessibility: accessibilityReport,
      performance: performanceReport,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Internal server error while executing audit.", 500, error);
  }
}
