"use client"
import React, { useState } from 'react'
import Header from '../_components/Header'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import MockCheckoutModal from './_components/MockCheckoutModal'

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for trying out AI website generation',
    credits: 5,
    features: [
      '5 AI generations',
      'Basic templates',
      'HTML/CSS/JS export',
      'Community support',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    description: 'For creators and developers who build regularly',
    credits: 50,
    features: [
      '50 AI generations/month',
      'All templates',
      'Priority AI model',
      'HTML/CSS/JS export',
      'Save unlimited projects',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    price: '₹999',
    period: 'per month',
    description: 'For power users and agencies',
    credits: 999,
    features: [
      'Unlimited AI generations',
      'All templates',
      'Fastest AI model',
      'HTML/CSS/JS export',
      'Save unlimited projects',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Go Unlimited',
    highlighted: false,
  },
]

export default function PricingPage() {
  const [checkoutPlan, setCheckoutPlan] = useState<(typeof plans)[number] | null>(null)

  return (
    <div className='min-h-screen bg-white'>
      <Header />

      {/* Hero */}
      <div className='text-center py-16 px-4'>
        <h1 className='text-5xl font-bold text-gray-900'>Simple, Transparent Pricing</h1>
        <p className='mt-4 text-xl text-gray-500 max-w-xl mx-auto'>
          Start free. Upgrade when you need more AI generations. No hidden fees.
        </p>
      </div>

      {/* Plans */}
      <div className='max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6'>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.highlighted
                ? 'border-blue-500 shadow-xl bg-blue-50 relative'
                : 'border-gray-200 shadow-sm bg-white'
            }`}
          >
            {plan.highlighted && (
              <span className='absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full'>
                Most Popular
              </span>
            )}

            <div className='mb-4'>
              <h2 className='text-xl font-bold text-gray-800'>{plan.name}</h2>
              <p className='text-gray-500 text-sm mt-1'>{plan.description}</p>
            </div>

            <div className='mb-6'>
              <span className='text-4xl font-bold text-gray-900'>{plan.price}</span>
              <span className='text-gray-500 text-sm ml-1'>/{plan.period}</span>
            </div>

            <ul className='flex flex-col gap-2 mb-8 flex-1'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex items-center gap-2 text-sm text-gray-700'>
                  <Check className='size-4 text-green-500 shrink-0' />
                  {feature}
                </li>
              ))}
            </ul>

            <SignedOut>
              <SignInButton mode='modal' forceRedirectUrl='/pricing'>
                <Button
                  className={`w-full ${plan.highlighted ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                onClick={() => setCheckoutPlan(plan)}
                className={`w-full ${plan.highlighted ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {plan.cta}
              </Button>
            </SignedIn>
          </div>
        ))}
      </div>

      {/* FAQ note */}
      <div className='text-center pb-16 text-gray-400 text-sm'>
        All plans include access to Tailwind CSS + Flowbite UI. Cancel anytime.
      </div>

      {checkoutPlan && (
        <MockCheckoutModal
          planKey={checkoutPlan.key}
          planName={checkoutPlan.name}
          price={checkoutPlan.price}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  )
}
