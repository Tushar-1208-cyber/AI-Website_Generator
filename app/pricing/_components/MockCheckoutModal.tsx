"use client"
import React, { useState } from 'react'
import { X, Loader2, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MockCheckoutModalProps {
  planKey: string
  planName: string
  price: string
  onClose: () => void
}

type Stage = 'form' | 'processing' | 'success'

function MockCheckoutModal({ planKey, planName, price, onClose }: MockCheckoutModalProps) {
  const [stage, setStage] = useState<Stage>('form')
  const router = useRouter()

  const handlePay = async () => {
    setStage('processing')
    try {
      const res = await axios.post('/api/mock-payment', { plan: planKey })
      if (res.data?.success) {
        setStage('success')
      }
    } catch (error) {
      console.error('Mock payment failed:', error)
      toast.error('Payment simulation failed. Please try again.')
      setStage('form')
    }
  }

  const handleDone = () => {
    onClose()
    router.push('/workspace')
    router.refresh()
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative'>
        {stage !== 'processing' && (
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
          >
            <X className='size-5' />
          </button>
        )}

        {stage === 'form' && (
          <>
            <div className='flex items-center gap-2 mb-1'>
              <CreditCard className='size-5 text-blue-600' />
              <h2 className='text-lg font-semibold text-gray-800'>Checkout</h2>
            </div>
            <p className='text-sm text-gray-500 mb-5'>
              You&apos;re upgrading to the <span className='font-medium text-gray-800'>{planName}</span> plan
            </p>

            <div className='bg-gray-50 rounded-xl p-4 mb-5 flex items-center justify-between'>
              <span className='text-sm text-gray-600'>{planName} Plan</span>
              <span className='text-lg font-bold text-gray-900'>{price}</span>
            </div>

            <div className='flex flex-col gap-3 mb-5'>
              <input
                disabled
                placeholder='4242 4242 4242 4242'
                className='w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400'
              />
              <div className='flex gap-3'>
                <input
                  disabled
                  placeholder='MM/YY'
                  className='w-1/2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400'
                />
                <input
                  disabled
                  placeholder='CVV'
                  className='w-1/2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400'
                />
              </div>
            </div>

            <Button onClick={handlePay} className='w-full bg-black hover:bg-black/90 text-white'>
              Pay {price}
            </Button>

            <p className='flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4'>
              <ShieldCheck className='size-3.5' />
              Test mode — no real payment will be charged
            </p>
          </>
        )}

        {stage === 'processing' && (
          <div className='flex flex-col items-center justify-center py-10 gap-3'>
            <Loader2 className='size-8 text-blue-600 animate-spin' />
            <p className='text-sm text-gray-500'>Processing your payment...</p>
          </div>
        )}

        {stage === 'success' && (
          <div className='flex flex-col items-center justify-center py-6 gap-3 text-center'>
            <CheckCircle2 className='size-12 text-green-500' />
            <h2 className='text-lg font-semibold text-gray-800'>Payment Successful!</h2>
            <p className='text-sm text-gray-500'>
              You&apos;ve been upgraded to the <span className='font-medium'>{planName}</span> plan.
              Your credits have been added.
            </p>
            <Button onClick={handleDone} className='w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white'>
              Go to Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MockCheckoutModal
