"use client"

import { ImagePlus, ArrowUp, LayoutDashboard, Key, Home, User, Loader2, Mic, MicOff, Shuffle, ShoppingCart, Newspaper, Briefcase } from 'lucide-react'
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

// Prompt Templates Library — quick-start ideas shown as chips below the input
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
        label: 'Hero',
        prompt: 'Create a modern header and centered hero section for a productivity SaaS. Include badge for feature announcement, image.',
        icon: Home
    },
    {
        label: 'User Profile Card',
        prompt: 'Create a modern user profile card component for a social media website. Title with a subtle gradient effect, subtitle, social proof and an image.',
        icon: User
    },
    {
        label: 'E-commerce',
        prompt: 'Create a modern e-commerce product listing page with a grid of product cards, filters sidebar, and a shopping cart icon in the navbar',
        icon: ShoppingCart
    },
    {
        label: 'Blog',
        prompt: 'Create a clean blog homepage with a featured post banner, a grid of article cards with thumbnails, and a newsletter signup section',
        icon: Newspaper
    },
    {
        label: 'Portfolio',
        prompt: 'Create a personal portfolio website for a designer with an about section, project gallery, skills list, and contact form',
        icon: Briefcase
    }
]

// A larger pool of ideas the "Surprise Me" button picks from randomly
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
        console.log('[Hero] CreateNewProject called with userPrompt:', userPrompt);
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
        console.log('[Hero] Creating project with:', { projectId, frameId, message });
        try {
            console.log('[Hero] Sending POST request to /api/project...');
            const result = await axios.post('/api/project', {
                projectId:projectId,
                frameId:frameId,
                message:message
            });
            console.log('[Hero] Project created successfully:', result.data);
            toast.success('Project Created Successfully')
            console.log('[Hero] Navigating to playground:', `/playground/${projectId}?frameId=${frameId}`);
            router.push(`/playground/${projectId}?frameId=${frameId}`)
        } catch (error) {
            setIsLoading(false);
            console.error('[Hero] Failed to create project:', error)
            toast.error('Failed to create project. Please try again.')

        }
    }
    return (
        <div className='flex flex-col items-center h-[80vh] justify-center'>
            {/* Header and Description */}
            <h2 className='text-6xl font-bold'>Create Stunning Websites with AI</h2>
            <p className=' mt-2 text-xl  text-gray-500'>Generate, Edit and Explore design with AI, Export Code to your projects</p>
            {/*input box */}
            <div className='w-full max-w-3xl p-5 border border-gray-200 rounded-xl mt-10 shadow-sm bg-white'>
                
                {selectedImage && (
                    <div className="relative inline-block mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                )}

                <textarea 
                    placeholder='Enter your website description...' 
                    className='w-full h-24 focus:outline-none resize-none bg-transparent'
                    value={userPrompt}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setUserPrompt(event.target.value)}
                    onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            console.log('[Hero] Enter key pressed, submitting description');
                            if ((userPrompt || selectedImage) && !isLoading) {
                                CreateNewProject();
                            }
                        }
                    }}
                ></textarea>
                <div className='flex items-center justify-between mt-2 pt-2 border-t border-gray-100'>
                    <div>
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
                            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`hover:bg-blue-50 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-600'}`}
                            onClick={handleVoiceInput}
                            title={isListening ? 'Stop listening' : 'Speak your idea'}
                        >
                            {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <SignedOut>
                            <SignInButton mode="modal" forceRedirectUrl="/workspace">
                                <Button disabled={!userPrompt && !selectedImage} className="bg-black hover:bg-black/90 text-white font-medium px-6"><ArrowUp className="size-4 mr-2" /> Generate</Button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <Button disabled={(!userPrompt && !selectedImage) || isLoading} onClick={CreateNewProject} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 transition-all shadow-sm">
                               {isLoading ? <Loader2 className='animate-spin size-4 mr-2' /> : <ArrowUp className="size-4 mr-2" />}
                               {isLoading ? 'Creating...' : 'Generate'}
                            </Button>
                        </SignedIn>
                    </div>
                </div>
            </div>
            {/* Suggestion List */}
            <div className='flex gap-3 mt-4 flex-wrap justify-center max-w-4xl'> 
                {suggestions.map((suggestion, index) => {
                    const IconComponent = suggestion.icon
                    return (
                        <Button 
                            key={index} 
                            variant="outline"
                            onClick={() => setUserPrompt(suggestion.prompt)}
                        >
                            <IconComponent />
                            {suggestion.label}
                        </Button>
                    )
                })}
                <Button
                    variant="outline"
                    onClick={handleSurpriseMe}
                    className="border-dashed text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                    <Shuffle className="size-4" />
                    Surprise Me
                </Button>
            </div>
        </div>
    )
}

export default Hero

const generateRandomFrameNumber= () => {
    const num=Math.floor(Math.random()*1000000);
    return num
}