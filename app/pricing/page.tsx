"use client";

import React, { useState } from "react";
import Header from "../_components/Header";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const plans = [
  {
    key: "free",
    planType: "Free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI website generation",
    credits: 15,
    features: [
      "15 AI generation credits",
      "Up to 5 active projects",
      "Standard component library",
      "Vercel deployment integration",
      "GitHub export & repository sync",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    key: "pro",
    planType: "Pro" as const,
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For creators and developers who build regularly",
    credits: 500,
    features: [
      "500 AI generation credits/month",
      "Up to 50 active projects",
      "Monaco editor & real-time patcher",
      "Real Vercel production deployments",
      "Real GitHub repo sync & auto-commit",
      "Automated SEO, WCAG & performance audits",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    key: "team",
    planType: "Team" as const,
    name: "Team",
    price: "$49",
    period: "per month",
    description: "For power users, agencies, and engineering teams",
    credits: 2500,
    features: [
      "2,500 AI generation credits/month",
      "Up to 1,000 active projects",
      "Up to 25 team members",
      "Monaco editor + custom design tokens",
      "Instant Vercel production deployments",
      "GitHub repo sync with branch management",
      "Full automated testing & diagnostic suites",
      "Dedicated 24/7 priority support",
    ],
    cta: "Upgrade to Team",
    highlighted: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planType: "Free" | "Pro" | "Team") => {
    if (planType === "Free") {
      router.push("/dashboard");
      return;
    }

    setLoadingPlan(planType);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || `Failed to create checkout session for ${planType}`);
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header />

      {/* Hero */}
      <div className="text-center py-16 px-4 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Simple, Transparent SaaS Pricing
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Start free. Upgrade when you need more AI credits, projects, or team seats. Powered by secure Stripe Checkout.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
              plan.highlighted
                ? "border-blue-500 shadow-2xl shadow-blue-500/10 bg-slate-900 relative scale-105"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md shadow-blue-500/30">
                Most Popular
              </span>
            )}

            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-400 text-xs ml-1.5">/{plan.period}</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/pricing">
                  <Button
                    className={`w-full font-bold text-xs py-2.5 rounded-xl ${
                      plan.highlighted
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Button
                  onClick={() => handleSelectPlan(plan.planType)}
                  disabled={loadingPlan === plan.planType}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-800 hover:bg-slate-700 text-white"
                  }`}
                >
                  {loadingPlan === plan.planType && <Loader2 className="size-4 animate-spin" />}
                  <span>{plan.cta}</span>
                </Button>
              </SignedIn>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center pb-16 text-slate-500 text-xs">
        All plans include access to Monaco Editor, AI visual builder, and Vercel & GitHub integrations. Cancel anytime.
      </div>
    </div>
  );
}
