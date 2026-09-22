"use client"

import { ImagePlus, ArrowUp, LayoutDashboard, Key, Home, User, Loader2, Mic, MicOff, Shuffle, ShoppingCart, Newspaper, Briefcase, Sparkles, Wand2 } from 'lucide-react'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { SignInButton, SignedOut, SignedIn } from '@clerk/nextjs'
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface Suggestion {
  label: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
}

interface ISpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: () => void;
  onend: () => void;
  onerror: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

const suggestions: Suggestion[] = [
  {
    label: 'Dashboard',
    prompt: 'Create an analytics dashboard to track customers and revenue data for a SaaS',
    icon: LayoutDashboard
  },
  {
    label: 'Sign up Form',
    prompt: 'Create a modern Sign up form with email/password fields, Google and Github login options, and terms Checkbox',
    icon: Key
  },
  {
    label: 'Hero Section',
    prompt: 'Create a modern header and centered hero section for a productivity SaaS. Include badge for feature announcement, image.',
    icon: Home
  },
  {
    label: 'User Profile',
    prompt: 'Create a modern user profile card component for a social media website. Title with a subtle gradient effect, subtitle, social proof and an image.',
    icon: User
  },
  {
    label: 'E-commerce',
    prompt: 'Create a modern e-commerce product listing page with a grid of product cards, filters sidebar, and a shopping cart icon in the navbar',
    icon: ShoppingCart
  },
  {
    label: 'Blog Portal',
    prompt: 'Create a clean blog homepage with a featured post banner, a grid of article cards with thumbnails, and a newsletter signup section',
    icon: Newspaper
  },
  {
    label: 'Portfolio',
    prompt: 'Create a personal portfolio website for a designer with an about section, project gallery, skills list, and contact form',
    icon: Briefcase
  }
]

const surpriseIdeas: string[] = [
  'Create a landing page for a meditation and mindfulness mobile app',
  'Create a restaurant website with a menu section, reservation form, and gallery',
  'Create a fitness gym website with class schedules, trainer profiles, and pricing plans',
  'Create a real estate listing page with property cards, filters, and a map placeholder',
  'Create a music streaming app UI with a now-playing bar and playlist sidebar',
  'Create a travel agency homepage with destination cards and a booking search bar',
  'Create a crypto/finance dashboard with charts, balance cards, and a transaction table',
  'Create a job board homepage with search filters and job listing cards',
  'Create an online course/education platform homepage with course cards and testimonials',
  'Create a wedding invitation website with an event timeline and RSVP form',
  'Create a pet adoption website with pet profile cards and an adoption form',
  'Create a coffee shop landing page with a menu, story section, and store locator',
]

function Hero() {
  const [userPrompt, setUserPrompt] = useState<string>('')
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast.success('Image attached! It will be used to generate your design.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not hear you clearly. Please try again.');
    };
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setUserPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSurpriseMe = () => {
    const idea = surpriseIdeas[Math.floor(Math.random() * surpriseIdeas.length)];
    setUserPrompt(idea);
  };

  const CreateNewProject = async () => {
    setIsLoading(true);
    const projectId = uuidv4();
    const frameId = generateRandomFrameNumber();
    const message: { role: string; content: string; image?: string } = {
      role: 'user',
      content: userPrompt || 'Recreate this design as a website.',
    }
    if (selectedImage) {
      message.image = selectedImage
    }

    try {
      const result = await axios.post('/api/project', {
        projectId: projectId,
        frameId: frameId,
        message: message
      });
      console.log('[Hero] Project created:', result.data);
      toast.success('Project Created Successfully')
      router.push(`/playground/${projectId}?frameId=${frameId}`)
    } catch (error) {
      setIsLoading(false);
      console.error('[Hero] Failed to create project:', error)
      toast.error('Failed to create project. Please try again.')
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30'>
      {/* Background Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-400/20 via-indigo-300/20 to-purple-400/20 blur-3xl pointer-events-none rounded-full -z-10" />

      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-500">
        <Sparkles className="size-3.5 text-blue-600 animate-pulse" />
        <span>AI Full-Stack Website Engine v2.0</span>
      </div>

      {/* Main Title & Subtitle */}
      <div className="text-center max-w-3xl mb-8 space-y-3">
        <h1 className='text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight'>
          Create <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'>Stunning Websites</span> with AI
        </h1>
        <p className='text-slate-500 text-sm md:text-base max-w-xl mx-auto font-normal leading-relaxed'>
          Generate full-stack multi-file applications, custom CSS & JS, interactive previews, and export clean production code in seconds.
        </p>
      </div>

      {/* Glassmorphism Prompt Card */}
      <div className='w-full max-w-2xl p-4 md:p-5 border border-slate-200/90 rounded-2xl shadow-xl shadow-blue-500/5 bg-white/90 backdrop-blur-md transition-all hover:border-blue-300/80 hover:shadow-2xl hover:shadow-blue-500/10'>
        {selectedImage && (
          <div className="relative inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-slate-200 shadow-xs" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition shadow-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        )}

        <textarea
          placeholder='Describe the website or full-stack web application you want to build...'
          className='w-full h-28 focus:outline-none resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed font-sans'
          value={userPrompt}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setUserPrompt(event.target.value)}
          onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if ((userPrompt || selectedImage) && !isLoading) {
                CreateNewProject();
              }
            }
          }}
        ></textarea>

        {/* Input Actions Bar */}
        <div className='flex items-center justify-between mt-2 pt-3 border-t border-slate-100'>
          <div className="flex items-center gap-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Image / Wireframe"
            >
              <ImagePlus className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`size-9 rounded-xl transition-all ${isListening ? 'text-rose-500 bg-rose-50 animate-pulse' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={handleVoiceInput}
              title={isListening ? 'Stop listening' : 'Speak your idea'}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/workspace">
                <Button disabled={!userPrompt && !selectedImage} className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 rounded-xl h-9 text-xs shadow-sm">
                  <ArrowUp className="size-3.5 mr-1.5" /> Generate Website
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                disabled={(!userPrompt && !selectedImage) || isLoading}
                onClick={CreateNewProject}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 rounded-xl h-9 text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                {isLoading ? <Loader2 className='animate-spin size-3.5 mr-1.5' /> : <Wand2 className="size-3.5 mr-1.5" />}
                {isLoading ? 'Generating...' : 'Generate Website'}
              </Button>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className='flex gap-2 mt-6 flex-wrap justify-center max-w-3xl'>
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon
          return (
            <button
              key={index}
              onClick={() => setUserPrompt(suggestion.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 text-xs font-medium rounded-xl shadow-xs transition-all hover:-translate-y-0.5"
            >
              <IconComponent className="size-3.5 text-blue-500" />
              {suggestion.label}
            </button>
          )
        })}

        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 border border-purple-200/80 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition-all shadow-xs hover:-translate-y-0.5"
        >
          <Shuffle className="size-3.5 text-purple-600 animate-spin-slow" />
          Surprise Me
        </button>
      </div>
    </div>
  )
}

export default Hero

const generateRandomFrameNumber = () => {
  const num = Math.floor(Math.random() * 1000000);
  return num
}