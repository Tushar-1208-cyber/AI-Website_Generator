import Stripe from "stripe";
import { db } from "@/config/db";
import { subscriptionsTable } from "@/config/schema";
import { eq } from "drizzle-orm";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  appInfo: {
    name: "AI Website Generator SaaS",
    version: "1.0.0",
  },
});

/**
 * Retrieves existing Stripe customer ID for user or creates a new Stripe customer
 */
export async function getOrCreateStripeCustomer(
  userEmail: string,
  userName?: string
): Promise<string> {
  const existingSub = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userEmail, userEmail))
    .limit(1);

  if (existingSub.length > 0 && existingSub[0].stripeCustomerId) {
    return existingSub[0].stripeCustomerId;
  }

  // Create new Stripe Customer
  const customer = await stripe.customers.create({
    email: userEmail,
    name: userName || userEmail.split("@")[0],
    metadata: { userEmail },
  });

  if (existingSub.length > 0) {
    await db
      .update(subscriptionsTable)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(subscriptionsTable.userEmail, userEmail));
  } else {
    await db.insert(subscriptionsTable).values({
      userEmail,
      stripeCustomerId: customer.id,
      plan: "Free",
      status: "active",
    });
  }

  return customer.id;
}
