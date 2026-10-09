import { db } from "@/config/db";
import { usersTable, projectsTable } from "@/config/schema";
import { eq, count } from "drizzle-orm";

export type SaaSPlan = "Free" | "Pro" | "Team";

export interface PlanEntitlements {
  maxProjects: number;
  aiCredits: number;
  canDeploy: boolean;
  canSyncGitHub: boolean;
  canRunAudits: boolean;
  maxTeamMembers: number;
}

export const SAAS_PLANS: Record<SaaSPlan, PlanEntitlements> = {
  Free: {
    maxProjects: 5,
    aiCredits: 15,
    canDeploy: true,
    canSyncGitHub: true,
    canRunAudits: true,
    maxTeamMembers: 1,
  },
  Pro: {
    maxProjects: 50,
    aiCredits: 500,
    canDeploy: true,
    canSyncGitHub: true,
    canRunAudits: true,
    maxTeamMembers: 5,
  },
  Team: {
    maxProjects: 1000,
    aiCredits: 2500,
    canDeploy: true,
    canSyncGitHub: true,
    canRunAudits: true,
    maxTeamMembers: 25,
  },
};

export interface UserSubscriptionDetails {
  email: string;
  name: string;
  plan: SaaSPlan;
  credits: number;
  entitlements: PlanEntitlements;
  projectCount: number;
}

/**
 * Fetches user subscription details, plan limits, remaining credits & active project count
 */
export async function getUserSubscriptionDetails(userEmail: string): Promise<UserSubscriptionDetails> {
  const userRecords = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, userEmail))
    .limit(1);

  const user = userRecords[0];
  const plan: SaaSPlan = (user?.plan as SaaSPlan) || "Free";
  const credits = user?.credits ?? 15;
  const entitlements = SAAS_PLANS[plan] || SAAS_PLANS.Free;

  // Count projects owned by user
  const projCountResult = await db
    .select({ total: count() })
    .from(projectsTable)
    .where(eq(projectsTable.createdBy, userEmail));

  const projectCount = projCountResult[0]?.total ?? 0;

  return {
    email: userEmail,
    name: user?.name || userEmail.split("@")[0],
    plan,
    credits,
    entitlements,
    projectCount,
  };
}

/**
 * Verifies if user is entitled to create a new project based on active plan project limits
 */
export async function checkCanCreateProject(userEmail: string): Promise<{ allowed: boolean; reason?: string }> {
  const details = await getUserSubscriptionDetails(userEmail);
  if (details.projectCount >= details.entitlements.maxProjects) {
    return {
      allowed: false,
      reason: `Project limit reached for your current ${details.plan} plan (${details.projectCount}/${details.entitlements.maxProjects} projects). Upgrade to Pro for more projects.`,
    };
  }
  return { allowed: true };
}

/**
 * Atomic credit check and deduction helper
 */
export async function checkAndDeductUserCredits(
  userEmail: string,
  cost: number = 1
): Promise<{ allowed: boolean; remainingCredits: number; reason?: string }> {
  const userRecords = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, userEmail))
    .limit(1);

  const user = userRecords[0];
  const currentCredits = user?.credits ?? 15;

  if (currentCredits < cost) {
    return {
      allowed: false,
      remainingCredits: currentCredits,
      reason: `Insufficient AI credits (${currentCredits} available, ${cost} required). Upgrade your plan or wait for reset.`,
    };
  }

  const updatedCredits = Math.max(0, currentCredits - cost);

  await db
    .update(usersTable)
    .set({ credits: updatedCredits })
    .where(eq(usersTable.email, userEmail));

  return {
    allowed: true,
    remainingCredits: updatedCredits,
  };
}
