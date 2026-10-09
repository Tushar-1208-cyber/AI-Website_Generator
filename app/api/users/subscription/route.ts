import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserSubscriptionDetails } from "@/lib/planEntitlementEngine";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const subscription = await getUserSubscriptionDetails(userEmail);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
