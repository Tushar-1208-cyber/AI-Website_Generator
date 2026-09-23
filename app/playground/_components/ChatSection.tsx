"use client";

import { ArrowUp } from 'lucide-react'
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
    <div className='flex h-2/5 min-h-0 w-full shrink-0 flex-col overflow-hidden border-b bg-slate-950 text-slate-100 shadow md:h-full md:w-[390px] md:border-b-0 md:border-r border-slate-800 font-sans'>
      {/* Messages Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Assistant</span>
        <span className="text-[10px] bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded font-mono">
          Gemini 3.6
        </span>
      </div>

      {/* Message List Section */}
      <div className='flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-800'>
        {Messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
            <p className='text-xs'>Ask the AI to modify designs, add features, or refactor code.</p>
          </div>
        ) : (
          Messages?.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-200 border border-slate-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className='flex justify-start animate-in fade-in duration-300'>
            <div className='p-3 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 flex items-center gap-2 animate-pulse text-xs font-medium'>
              <Spinner className='size-3.5 animate-spin text-blue-500' />
              <span>AI is generating code...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section with Quick Refactor Bar & Agent Activity Panel */}
      <div className='flex shrink-0 flex-col border-t border-slate-800 bg-slate-900/80 p-3 gap-2'>
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

        <div className="flex items-center gap-2">
          <textarea
            value={input}
            placeholder='Type modification request...'
            className='flex-1 resize-none border border-slate-800 bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 h-12 leading-relaxed'
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
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 px-3 shadow-md shadow-blue-500/20 disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatSection