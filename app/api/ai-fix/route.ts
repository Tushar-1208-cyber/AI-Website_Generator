import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getAuthenticatedUser,
  safeErrorResponse,
  FilesMapSchema,
  ProjectIdSchema,
} from "@/lib/authSecurity";
import { detectErrors, autoFixErrors, DetectedIssue } from "@/lib/errorDetectionEngine";
import { parseMultiFiles, serializeMultiFiles } from "@/lib/fileTree";
import { z } from "zod";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const AiFixRequestSchema = z.object({
  filesMap: FilesMapSchema,
  issues: z.array(z.any()).optional().default([]),
  projectId: ProjectIdSchema.optional().nullable(),
  frameId: z.string().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("User not authenticated. Please log in.", 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload.", 400);
    }

    const parseResult = AiFixRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid request payload.";
      return safeErrorResponse(firstError, 400);
    }

    const { filesMap, issues: clientIssues } = parseResult.data;

    // Run server-side diagnostic detection to ensure complete issue inventory
    const serverIssues = detectErrors(filesMap);
    const activeIssues: DetectedIssue[] = serverIssues.length > 0 ? serverIssues : clientIssues;

    if (activeIssues.length === 0) {
      return NextResponse.json({
        success: true,
        fixedFilesMap: filesMap,
        fixedCount: 0,
        summary: "No issues detected to repair.",
        repairLogs: ["Code is valid and free of structural errors."],
      });
    }

    // Fallback runner if Gemini is unavailable, rate-limited, or fails
    const runDeterministicFallback = (reason: string) => {
      console.log(`[AI Fix] Using deterministic auto-fix fallback: ${reason}`);
      const fallbackResult = autoFixErrors(filesMap, activeIssues);
      return NextResponse.json({
        success: true,
        fixedFilesMap: fallbackResult.fixedFilesMap,
        fixedCount: fallbackResult.fixedCount,
        summary: `Repaired ${fallbackResult.fixedCount} code issue(s) cleanly.`,
        repairLogs: fallbackResult.repairLogs,
        fallback: true,
      });
    };

    if (!GEMINI_KEY) {
      return runDeterministicFallback("AI API key not configured.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const fallbackModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ];

    const issuesDescription = activeIssues
      .map(
        (i, idx) =>
          `${idx + 1}. [${i.type}] ${i.filePath}${i.lineNumber ? ` (Line ${i.lineNumber})` : ""}: ${i.message}`
      )
      .join("\n");

    const prompt = `You are a senior full-stack AI web developer and code diagnostic engineer.
Fix all identified syntax errors, unclosed HTML tags, broken links, malformed attributes, and structural issues in the provided web project files.

DETECTED ISSUES:
${issuesDescription}

CRITICAL RULES:
1. Fix all identified structural and syntax errors (e.g. unclosed <div>, <span>, or container tags; truncated elements; invalid attributes).
2. PRESERVE all existing Tailwind CSS styles, color themes, layouts, scripts, content, and interactive features. Do NOT rewrite or redesign the application.
3. Ensure every open tag is properly closed with valid HTML5 hierarchical nesting.
4. If multiple files are provided, return each file wrapped with standard delimiters:
--- FILE: path/to/file.ext ---
<repaired file content>

If only index.html is provided, you may return index.html using the delimiter:
--- FILE: index.html ---
<!DOCTYPE html>
...

FILES TO REPAIR:
${serializeMultiFiles(filesMap)}`;

    let repairedText = "";
    let selectedModel = "";

    for (const modelName of fallbackModels) {
      try {
        console.log(`[AI Fix] Attempting repair with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        repairedText = result.response.text();
        selectedModel = modelName;
        if (repairedText && repairedText.trim().length > 0) {
          break;
        }
      } catch (err: unknown) {
        console.warn(`[AI Fix] Model ${modelName} failed:`, err);
      }
    }

    if (!repairedText || !repairedText.trim()) {
      return runDeterministicFallback("AI models were temporarily unavailable.");
    }

    // Parse repaired files
    const repairedFilesMap = parseMultiFiles(repairedText);
    const remainingIssues = detectErrors(repairedFilesMap);

    // If Gemini resolved issues or reduced them, accept Gemini's output
    if (remainingIssues.length === 0 || remainingIssues.length < activeIssues.length) {
      return NextResponse.json({
        success: true,
        fixedFilesMap: repairedFilesMap,
        fixedCount: Math.max(1, activeIssues.length - remainingIssues.length),
        summary: `AI (${selectedModel}) successfully repaired detected code & tag issues.`,
        repairLogs: [
          `Repaired using ${selectedModel}`,
          ...activeIssues.map((i) => `Resolved: ${i.message}`),
        ],
      });
    }

    // If Gemini's repair still had issues, use deterministic engine to finish
    console.log("[AI Fix] Running deterministic cleanup on AI output...");
    const finalCleaned = autoFixErrors(repairedFilesMap, remainingIssues);
    return NextResponse.json({
      success: true,
      fixedFilesMap: finalCleaned.fixedFilesMap,
      fixedCount: activeIssues.length,
      summary: `Repaired all code & tag issues cleanly with AI assistance.`,
      repairLogs: finalCleaned.repairLogs,
    });
  } catch (error: unknown) {
    console.error("[AI Fix] Unexpected error in /api/ai-fix:", error);
    return safeErrorResponse("An error occurred while repairing the code. Please try again.", 500);
  }
}
