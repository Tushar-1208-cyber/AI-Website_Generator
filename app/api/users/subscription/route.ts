import { NextResponse } from "next/server";
import { getUserSubscriptionDetails } from "@/lib/planEntitlementEngine";
import { getAuthenticatedUser, safeErrorResponse } from "@/lib/authSecurity";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("User not authenticated", 401);
    }

    const { userEmail } = auth;
    const subscription = await getUserSubscriptionDetails(userEmail);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to fetch user subscription details", 500, error);
  }
}
