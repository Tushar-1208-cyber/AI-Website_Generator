import React from 'react'
import Header from '../_components/Header'
import { Mail, MessageSquare, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <div className='min-h-screen bg-white'>
      <Header />

      <div className='max-w-2xl mx-auto px-4 py-20'>
        {/* Title */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900'>Get in Touch</h1>
          <p className='mt-3 text-lg text-gray-500'>
            Have a question, bug report, or feature request? We would love to hear from you.
          </p>
        </div>

        {/* Contact Options */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-12'>
          <a
            href='mailto:tushargupta20055@gmail.com'
            className='flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-center group'
          >
            <div className='size-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100'>
              <Mail className='size-5 text-blue-500' />
            </div>
            <h3 className='font-semibold text-gray-800'>Email Us</h3>
            <p className='text-sm text-gray-500'>tushargupta20055@gmail.com</p>
          </a>

          <a
            href='https://github.com/Tushar-1208-cyber/AI-Website_Generator'
            target='_blank'
            rel='noopener noreferrer'
            className='flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 hover:border-gray-700 hover:shadow-md transition-all text-center group'
          >
            <div className='size-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100'>
              <Github className='size-5 text-gray-700' />
            </div>
            <h3 className='font-semibold text-gray-800'>GitHub Issues</h3>
            <p className='text-sm text-gray-500'>Report bugs or request features</p>
          </a>

          <div className='flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 text-center'>
            <div className='size-12 bg-green-50 rounded-full flex items-center justify-center'>
              <MessageSquare className='size-5 text-green-500' />
            </div>
            <h3 className='font-semibold text-gray-800'>Response Time</h3>
            <p className='text-sm text-gray-500'>Usually within 24 hours</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className='bg-gray-50 rounded-2xl p-8 border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-800 mb-6'>Send a Message</h2>
          <form
            action='mailto:tushargupta20055@gmail.com'
            method='GET'
            className='flex flex-col gap-4'
          >
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Your Name</label>
              <input
                type='text'
                name='name'
                placeholder='Rahul Sharma'
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Email Address</label>
              <input
                type='email'
                name='email'
                placeholder='rahul@example.com'
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Subject</label>
              <input
                type='text'
                name='subject'
                placeholder='Bug report / Feature request / General query'
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Message</label>
              <textarea
                name='body'
                rows={5}
                placeholder='Describe your issue or question...'
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none'
                required
              />
            </div>
            <Button type='submit' className='w-full bg-black hover:bg-black/90 text-white'>
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
