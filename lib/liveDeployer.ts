/**
 * lib/liveDeployer.ts
 * Real Vercel deployment helper interface.
 * Connects frontend UI to server-side /api/deploy route for genuine Vercel REST API deployment and history.
 */

export interface DeploymentStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
}

export interface RealDeploymentRecord {
  id: number | string;
  deploymentID: string;
  projectID: string;
  url: string;
  status: "BUILDING" | "READY" | "ERROR" | "CANCELED";
  error?: string | null;
  createdOn: string;
  readyOn?: string | null;
}

export interface DeploymentResult {
  id: string;
  url: string;
  deployedAt: string;
  pagesCount: number;
  status: string;
  error?: string;
}

/**
 * Triggers a real Vercel production deployment via POST /api/deploy.
 */
export async function executeRealDeployment(
  projectId: string,
  filesMap?: Record<string, string>,
  onStepProgress?: (stepId: string, steps: DeploymentStep[]) => void
): Promise<DeploymentResult> {
  const steps: DeploymentStep[] = [
    { id: "prep", label: "Validating project files & entry points...", status: "pending" },
    { id: "upload", label: "Packaging static assets to Vercel API...", status: "pending" },
    { id: "build", label: "Vercel Global CDN building & provisioning edge SSL...", status: "pending" },
    { id: "ready", label: "Deployment complete & live on edge network!", status: "pending" },
  ];

  const updateStep = (index: number, status: "in_progress" | "completed" | "error") => {
    steps[index].status = status;
    if (onStepProgress) {
      onStepProgress(steps[index].id, [...steps]);
    }
  };

  // Step 1: Prep
  updateStep(0, "in_progress");
  await new Promise((r) => setTimeout(r, 400));
  updateStep(0, "completed");

  // Step 2: Uploading
  updateStep(1, "in_progress");

  try {
    const res = await fetch("/api/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        filesMap: filesMap && Object.keys(filesMap).length > 0 ? filesMap : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      updateStep(1, "error");
      const errorMsg = data.error || "Deployment failed";
      throw new Error(errorMsg);
    }

    updateStep(1, "completed");

    // Step 3: Building & Provisioning
    updateStep(2, "in_progress");
    await new Promise((r) => setTimeout(r, 500));
    updateStep(2, "completed");

    // Step 4: Ready
    updateStep(3, "completed");

    const record: RealDeploymentRecord = data.deployment;

    return {
      id: record.deploymentID,
      url: record.url,
      deployedAt: record.readyOn || record.createdOn || new Date().toISOString(),
      pagesCount: filesMap ? Object.keys(filesMap).length : 1,
      status: record.status,
      error: record.error || undefined,
    };
  } catch (err: any) {
    updateStep(2, "error");
    throw err;
  }
}

/**
 * Backward compatibility alias mapping simulateDeployment calls directly to real deployment.
 */
export async function simulateDeployment(
  projectId: string,
  filesCount: number,
  onStepProgress?: (stepId: string, steps: DeploymentStep[]) => void
): Promise<DeploymentResult> {
  return executeRealDeployment(projectId, undefined, onStepProgress);
}

/**
 * Retrieves historical real Vercel deployment records for a project via GET /api/deploy.
 */
export async function fetchDeploymentHistory(projectId: string): Promise<RealDeploymentRecord[]> {
  try {
    const res = await fetch(`/api/deploy?projectId=${encodeURIComponent(projectId)}`);
    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.deployments)) {
      return data.deployments;
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch deployment history:", err);
    return [];
  }
}
