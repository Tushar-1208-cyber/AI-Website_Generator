import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripeClient";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "User email address not found." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = (body.plan || "Pro") as "Pro" | "Team";

    let priceId = process.env.STRIPE_PRO_PRICE_ID || "";
    if (plan === "Team") {
      priceId = process.env.STRIPE_TEAM_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || "";
    }

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe Price ID not configured for plan '${plan}'. Please set STRIPE_PRO_PRICE_ID or STRIPE_TEAM_PRICE_ID.` },
        { status: 500 }
      );
    }

    // Get or create Stripe Customer
    const customerId = await getOrCreateStripeCustomer(
      primaryEmail,
      `${user.firstName || ""} ${user.lastName || ""}`.trim()
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
      metadata: {
        userId,
        userEmail: primaryEmail,
        targetPlan: plan,
      },
      subscription_data: {
        metadata: {
          userId,
          userEmail: primaryEmail,
          targetPlan: plan,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
