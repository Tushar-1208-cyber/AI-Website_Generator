import { db } from "@/config/db";
import { usersTable, projectsTable, subscriptionsTable } from "@/config/schema";
import { eq, count, sql, and, gte } from "drizzle-orm";

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
  isDeveloper?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Verifies whether an email is registered in the server-side environment-controlled developer allowlist.
 */
export function isDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.DEVELOPER_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
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

  const credits = user?.credits ?? SAAS_PLANS[effectivePlan]?.aiCredits ?? 15;
  const isDev = isDeveloperEmail(userEmail);
  const baseEntitlements = SAAS_PLANS[effectivePlan] || SAAS_PLANS.Free;
  const entitlements: PlanEntitlements = isDev
    ? { ...baseEntitlements, maxProjects: 1000 }
    : baseEntitlements;

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
    isDeveloper: isDev,
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
  if (isDeveloperEmail(userEmail)) {
    return { allowed: true };
  }
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
 * Atomic credit check and deduction helper with race condition protection
 */
export async function checkAndDeductUserCredits(
  userEmail: string,
  cost: number = 1
): Promise<{ allowed: boolean; remainingCredits: number; reason?: string }> {
  const updatedUser = await db
    .update(usersTable)
    .set({ credits: sql`${usersTable.credits} - ${cost}` })
    .where(and(eq(usersTable.email, userEmail), gte(usersTable.credits, cost)))
    .returning({ remainingCredits: usersTable.credits });

  if (updatedUser.length === 0) {
    const userRecords = await db
      .select({ credits: usersTable.credits })
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    const currentCredits = userRecords[0]?.credits ?? 0;
    return {
      allowed: false,
      remainingCredits: currentCredits,
      reason: `Insufficient AI credits (${currentCredits} available, ${cost} required). Upgrade your plan or wait for reset.`,
    };
  }

  return {
    allowed: true,
    remainingCredits: updatedUser[0].remainingCredits ?? 0,
  };
}
