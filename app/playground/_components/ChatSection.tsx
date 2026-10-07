"use client";

import { ArrowUp, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import QuickRefactorBar from './QuickRefactorBar'
import AgentActivityPanel from './AgentActivityPanel'
import { AgentStep, executeAgentTask } from '@/lib/autonomousAgentEngine'
import { indexProject } from '@/lib/projectContextEngine'

type Message = {
  role: string
  content: string
  loading?: boolean
}

interface ChatSectionProps {
  Messages?: Message[]
  onSend: (input: string) => void
  loading?: boolean
}

function ChatSection({ Messages, onSend, loading }: ChatSectionProps) {
  const [input, setInput] = useState<string>('')
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [agentSummary, setAgentSummary] = useState<string | null>(null)

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const prompt = input;
    setInput('');

    // Trigger Autonomous Agent execution tracking
    const index = indexProject({ "index.html": "<html></html>" });
    onSend(prompt);

    try {
      const res = await executeAgentTask(prompt, { "index.html": "<html></html>" }, index, (steps) => {
        setAgentSteps(steps);
      });
      setAgentSummary(res.summary);
    } catch {
      // fallback
    }
  }

  const handleQuickRefactorAction = async (prompt: string) => {
    if (loading) return;
    onSend(prompt);

    const index = indexProject({ "index.html": "<html></html>" });
    try {
      const res = await executeAgentTask(prompt, { "index.html": "<html></html>" }, index, (steps) => {
        setAgentSteps(steps);
      });
      setAgentSummary(res.summary);
    } catch {
      // fallback
    }
  }

  return (
    <div className='flex h-2/5 min-h-0 w-full shrink-0 flex-col overflow-hidden border-b bg-white text-slate-800 shadow-xs md:h-full md:w-[380px] md:border-b-0 md:border-r border-slate-200/90 font-sans transition-all'>
      {/* Messages Header */}
      <div className="px-4 py-3 border-b border-slate-200/90 bg-slate-50/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">AI Design Copilot</span>
        </div>
        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 font-semibold">
          <Sparkles className="size-2.5 text-blue-600" />
          <span>Gemini 3.5 Flash</span>
        </span>
      </div>

      {/* Message List Section */}
      <div className='flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200'>
        {Messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-4 text-center">
            <p className='text-xs text-slate-600 font-medium leading-relaxed'>What would you like to build or modify today?</p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs text-left">
              {[
                "🚀 Modern SaaS Product Landing Page",
                "👟 E-Commerce Storefront with Cart",
                "📊 Analytics & Crypto Dashboard",
                "🎨 Creative Agency Studio Portfolio"
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                  }}
                  className="text-[11px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-blue-400 transition-all text-left shadow-2xs font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          Messages?.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-medium'
                    : 'bg-slate-100 text-slate-800 border border-slate-200/90 font-medium'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className='flex justify-start animate-in fade-in duration-300'>
            <div className='p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-blue-600 flex items-center gap-2 animate-pulse text-xs font-medium'>
              <Spinner className='size-3.5 animate-spin text-blue-600' />
              <span>AI Agent is architecting code...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section with Quick Refactor Bar & Agent Activity Panel */}
      <div className='flex shrink-0 flex-col border-t border-slate-200/90 bg-slate-50/90 backdrop-blur-md p-3 gap-2.5'>
        <AgentActivityPanel
          steps={agentSteps}
          isExecuting={Boolean(loading)}
          summary={agentSummary}
          onClose={() => {
            setAgentSteps([]);
            setAgentSummary(null);
          }}
        />

        <QuickRefactorBar onSelectAction={handleQuickRefactorAction} disabled={loading} />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              placeholder='Type modification request...'
              className='flex-1 resize-none border border-slate-300 bg-white text-slate-900 text-xs rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 h-12 leading-relaxed font-sans placeholder:text-slate-400 font-medium shadow-2xs'
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-3.5 shadow-md shadow-blue-500/10 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-right px-1">Press ↵ to send • Shift + ↵ for line break</p>
        </div>
      </div>
    </div>
  )
}

export default ChatSection