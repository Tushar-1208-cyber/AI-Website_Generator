/**
 * lib/vercelClient.ts
 * Server-side Vercel REST API client.
 * Handles project payload packaging, deployment creation, status polling, and URL retrieval via Vercel API v13.
 */

export interface VercelFileItem {
  file: string;
  data: string;
  encoding?: 'utf-8' | 'base64';
}

export interface CreateVercelDeploymentOptions {
  projectName: string;
  filesMap: Record<string, string>;
  target?: 'production' | 'preview';
}

export interface VercelDeploymentResponse {
  deploymentId: string;
  url: string;
  readyState: 'INITIALIZING' | 'ANALYZING' | 'BUILDING' | 'DEPLOYING' | 'READY' | 'ERROR' | 'CANCELED';
  error?: string;
}

/**
 * Sanitizes project name to comply with Vercel naming restrictions (lowercase alphanumeric and hyphens).
 */
export function sanitizeVercelProjectName(name: string): string {
  if (!name) return "ai-site-project";
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (sanitized || "ai-site-project").slice(0, 50);
}

/**
 * Sanitizes file paths to prevent directory traversal attack vectors.
 */
export function sanitizeVercelPath(filePath: string): string {
  if (!filePath) return "";
  return filePath
    .replace(/(\.\.[\/\\])+/g, "")
    .replace(/^[/\\]+/, "")
    .trim();
}

/**
 * Sends a POST request to Vercel API v13 to create a real deployment.
 */
export async function createVercelDeployment(
  options: CreateVercelDeploymentOptions
): Promise<VercelDeploymentResponse> {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    throw new Error(
      "Missing VERCEL_TOKEN in server environment variables (.env.local). Please set VERCEL_TOKEN to deploy to Vercel."
    );
  }

  const cleanName = sanitizeVercelProjectName(options.projectName);

  const filesPayload: VercelFileItem[] = [];
  for (const [pathStr, contentStr] of Object.entries(options.filesMap)) {
    const cleanPath = sanitizeVercelPath(pathStr);
    if (cleanPath && typeof contentStr === "string") {
      filesPayload.push({
        file: cleanPath,
        data: contentStr,
      });
    }
  }

  if (filesPayload.length === 0) {
    throw new Error("Cannot deploy project: No valid files found in payload.");
  }

  // Ensure index.html exists
  const hasIndex = filesPayload.some((f) => f.file.toLowerCase() === "index.html");
  if (!hasIndex) {
    throw new Error("Cannot deploy project: Missing required entry file 'index.html'.");
  }

  const bodyPayload = {
    name: cleanName,
    files: filesPayload,
    target: options.target || "production",
    projectSettings: {
      framework: null, // Static HTML/CSS/JS deploy
    },
  };

  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || "Vercel API returned an error";
    console.error("[Vercel Client Error]", data);
    throw new Error(`Vercel deployment failed: ${errorMsg}`);
  }

  const rawUrl = data.url || `${data.id}.vercel.app`;
  const formattedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  return {
    deploymentId: data.id,
    url: formattedUrl,
    readyState: data.readyState || "BUILDING",
  };
}

/**
 * Fetches real-time status of a Vercel deployment by deployment ID.
 */
export async function getVercelDeploymentStatus(
  deploymentId: string
): Promise<VercelDeploymentResponse> {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    throw new Error("Missing VERCEL_TOKEN in server environment variables (.env.local).");
  }

  const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || "Failed to fetch deployment status";
    throw new Error(errorMsg);
  }

  const rawUrl = data.url || `${data.id}.vercel.app`;
  const formattedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  return {
    deploymentId: data.id,
    url: formattedUrl,
    readyState: data.readyState || "READY",
    error: data.error?.message,
  };
}

/**
 * Polls Vercel deployment status until ready, errored, or max timeout reached.
 */
export async function pollVercelDeploymentStatus(
  deploymentId: string,
  maxWaitMs: number = 35000
): Promise<VercelDeploymentResponse> {
  const startTime = Date.now();
  let statusRes = await getVercelDeploymentStatus(deploymentId);

  while (
    statusRes.readyState !== "READY" &&
    statusRes.readyState !== "ERROR" &&
    statusRes.readyState !== "CANCELED" &&
    Date.now() - startTime < maxWaitMs
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      statusRes = await getVercelDeploymentStatus(deploymentId);
    } catch {
      // Continue polling loop
    }
  }

  return statusRes;
}
