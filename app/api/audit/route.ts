import { NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seoAuditEngine";
import { runAccessibilityAudit } from "@/lib/accessibilityAuditEngine";
import { runProjectPerformanceAudit } from "@/lib/performanceAuditEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filesMap } = body;

    if (!filesMap || typeof filesMap !== "object") {
      return NextResponse.json(
        { error: "filesMap parameter is required." },
        { status: 400 }
      );
    }

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
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
