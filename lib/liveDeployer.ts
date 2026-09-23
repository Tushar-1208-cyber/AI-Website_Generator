export interface DeploymentStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed";
}

export interface DeploymentResult {
  id: string;
  url: string;
  deployedAt: string;
  pagesCount: number;
}

/**
 * Generates a unique deployment ID based on project ID and timestamp.
 */
export function generateDeploymentId(projectId: string): string {
  const sanitize = projectId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${sanitize || "site"}-${randomSuffix}`;
}

/**
 * Constructs a live production deployment URL for the site.
 */
export function getLiveUrl(deployId: string): string {
  return `https://${deployId}.vercel.app`;
}

/**
 * Packages files and simulates an instant edge deployment sequence.
 */
export async function simulateDeployment(
  projectId: string,
  filesCount: number,
  onProgress?: (stepId: string, steps: DeploymentStep[]) => void
): Promise<DeploymentResult> {
  const deployId = generateDeploymentId(projectId);
  const liveUrl = getLiveUrl(deployId);

  const steps: DeploymentStep[] = [
    { id: "bundle", label: "Packaging project & static assets...", status: "pending" },
    { id: "ssl", label: "Provisioning edge SSL certificate...", status: "pending" },
    { id: "cdn", label: "Deploying to Vercel global CDN edge network...", status: "pending" },
    { id: "live", label: "Site is live!", status: "pending" },
  ];

  const updateStep = (index: number, status: "in_progress" | "completed") => {
    steps[index].status = status;
    if (onProgress) {
      onProgress(steps[index].id, [...steps]);
    }
  };

  // Step 1: Bundle
  updateStep(0, "in_progress");
  await new Promise((r) => setTimeout(r, 600));
  updateStep(0, "completed");

  // Step 2: SSL
  updateStep(1, "in_progress");
  await new Promise((r) => setTimeout(r, 700));
  updateStep(1, "completed");

  // Step 3: CDN
  updateStep(2, "in_progress");
  await new Promise((r) => setTimeout(r, 800));
  updateStep(2, "completed");

  // Step 4: Live
  updateStep(3, "completed");

  return {
    id: deployId,
    url: liveUrl,
    deployedAt: new Date().toISOString(),
    pagesCount: Math.max(1, filesCount),
  };
}
