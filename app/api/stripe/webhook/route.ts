import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripeClient";
import { db } from "@/config/db";
import { subscriptionsTable, stripeWebhookLogsTable, usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing stripe-signature header." },
          { status: 400 }
        );
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      if (process.env.NODE_ENV === "production") {
        console.error("STRIPE_WEBHOOK_SECRET is not configured in production mode.");
        return NextResponse.json(
          { error: "Stripe Webhook Secret is required in production." },
          { status: 500 }
        );
      }
      console.warn("STRIPE_WEBHOOK_SECRET not configured. Parsing payload for dev mode.");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Webhook signature verification failed: ${errMsg}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errMsg}` },
      { status: 400 }
    );
  }

  // Idempotency Check: check if event was ALREADY successfully processed
  try {
    const existingLog = await db
      .select()
      .from(stripeWebhookLogsTable)
      .where(eq(stripeWebhookLogsTable.eventId, event.id))
      .limit(1);

    if (existingLog.length > 0) {
      return NextResponse.json({ received: true, idempotent: true });
    }
  } catch (err: unknown) {
    console.error("Error checking webhook logs table:", err);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userEmail = session.metadata?.userEmail;
          const targetPlan = (session.metadata?.targetPlan || "Pro") as "Pro" | "Team";

          if (userEmail) {
            const subData = await stripe.subscriptions.retrieve(subscriptionId);
            const periodStart = subData.items?.data[0]?.created
              ? new Date(subData.items.data[0].created * 1000)
              : new Date();
            const periodEnd = subData.items?.data[0]?.price
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : new Date();

            const planCredits = targetPlan === "Team" ? 2000 : 500;

            // Upsert subscription
            const existingSub = await db
              .select()
              .from(subscriptionsTable)
              .where(eq(subscriptionsTable.userEmail, userEmail))
              .limit(1);

            if (existingSub.length > 0) {
              await db
                .update(subscriptionsTable)
                .set({
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  stripePriceId: subData.items.data[0]?.price.id || null,
                  plan: targetPlan,
                  status: "active",
                  currentPeriodStart: periodStart,
                  currentPeriodEnd: periodEnd,
                  cancelAtPeriodEnd: subData.cancel_at_period_end ? 1 : 0,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptionsTable.userEmail, userEmail));
            } else {
              await db.insert(subscriptionsTable).values({
                userEmail,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: subData.items.data[0]?.price.id || null,
                plan: targetPlan,
                status: "active",
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subData.cancel_at_period_end ? 1 : 0,
              });
            }

            // Update user record
            await db
              .update(usersTable)
              .set({
                plan: targetPlan,
                credits: planCredits,
              })
              .where(eq(usersTable.email, userEmail));
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price.id;

        // Find sub record by customer ID or email
        const existingSubs = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.stripeCustomerId, customerId))
          .limit(1);

        let userEmail = existingSubs[0]?.userEmail;

        if (!userEmail) {
          const customerObj = await stripe.customers.retrieve(customerId);
          if (!customerObj.deleted && customerObj.email) {
            userEmail = customerObj.email;
          }
        }

        if (userEmail) {
          let plan: "Free" | "Pro" | "Team" = "Free";
          if (status === "active" || status === "trialing") {
            if (priceId && priceId === process.env.STRIPE_TEAM_PRICE_ID) {
              plan = "Team";
            } else if (existingSubs[0]?.plan === "Team") {
              plan = "Team";
            } else {
              plan = "Pro";
            }
          }

          const itemsData = subscription.items?.data[0];
          const periodStart = itemsData ? new Date(itemsData.created * 1000) : new Date();
          const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await db
            .update(subscriptionsTable)
            .set({
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId || null,
              plan: plan,
              status: status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.userEmail, userEmail));

          // Update users table plan
          await db
            .update(usersTable)
            .set({
              plan: plan,
            })
            .where(eq(usersTable.email, userEmail));
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await db
            .update(subscriptionsTable)
            .set({
              status: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.stripeCustomerId, customerId));
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Log idempotency AFTER successful event handling so failed events remain retryable
    try {
      await db.insert(stripeWebhookLogsTable).values({
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
      });
    } catch (err: unknown) {
      console.error("Error logging completed webhook event:", err);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Error processing webhook event:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
