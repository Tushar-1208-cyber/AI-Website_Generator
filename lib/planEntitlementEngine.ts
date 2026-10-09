import { db } from "@/config/db";
import { usersTable, projectsTable, subscriptionsTable } from "@/config/schema";
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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Fetches user subscription details, live Stripe status, plan limits, remaining credits & active project count
 */
export async function getUserSubscriptionDetails(userEmail: string): Promise<UserSubscriptionDetails> {
  const userRecords = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, userEmail))
    .limit(1);

  const user = userRecords[0];

  // Fetch live subscription record if present
  const subRecords = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userEmail, userEmail))
    .limit(1);

  const sub = subRecords[0];

  const rawPlan: SaaSPlan = (user?.plan as SaaSPlan) || (sub?.plan as SaaSPlan) || "Free";
  const status = sub?.status || "active";
  const now = new Date();

  // If subscription is canceled and period ended, treat as Free
  let effectivePlan: SaaSPlan = rawPlan;
  if (status === "canceled" && sub?.currentPeriodEnd && sub.currentPeriodEnd < now) {
    effectivePlan = "Free";
  } else if (status === "unpaid" || status === "past_due") {
    // If unpaid, restrict to Free entitlements while giving user chance to fix payment in portal
    effectivePlan = "Free";
  }

  const credits = user?.credits ?? (effectivePlan === "Team" ? 2000 : effectivePlan === "Pro" ? 500 : 15);
  const entitlements = SAAS_PLANS[effectivePlan] || SAAS_PLANS.Free;

  // Count projects owned by user
  const projCountResult = await db
    .select({ total: count() })
    .from(projectsTable)
    .where(eq(projectsTable.createdBy, userEmail));

  const projectCount = projCountResult[0]?.total ?? 0;

  return {
    email: userEmail,
    name: user?.name || userEmail.split("@")[0],
    plan: effectivePlan,
    credits,
    entitlements,
    projectCount,
    stripeCustomerId: sub?.stripeCustomerId,
    stripeSubscriptionId: sub?.stripeSubscriptionId || undefined,
    subscriptionStatus: status,
    currentPeriodEnd: sub?.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
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
