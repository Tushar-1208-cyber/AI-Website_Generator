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

    const customerId = await getOrCreateStripeCustomer(
      primaryEmail,
      `${user.firstName || ""} ${user.lastName || ""}`.trim()
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("Stripe billing portal error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create customer portal session";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
