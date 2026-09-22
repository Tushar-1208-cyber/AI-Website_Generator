import { ArrowUp } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

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


const handleSendMessage = async () => {
  if(!input.trim()) return;
  onSend(input);
  setInput('');
}

  
  return (
    <div className='flex h-2/5 min-h-0 w-full shrink-0 flex-col overflow-hidden border-b bg-white p-4 shadow md:h-full md:w-[390px] md:border-b-0 md:border-r' >
      { /* Message Section*/}
        <div className='flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto p-4'>
          {Messages?.length === 0 ?
          (
            <p className='text-grey-400 text-center'>No messages yet</p>
          ):(
            Messages?.map((message, index) => (
              <div key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2 rounded-lg max-w-[80%] ${
                message.role === 'user' ? 
                'bg-gray-100 text-black' 
                : 'bg-gray-300 text-black'
              }`}>
              {message.content}
              </div>
              </div>
            ))
          )}
          {loading && (
            <div className='flex justify-start animate-in fade-in duration-300'>
              <div className='p-3 rounded-lg bg-gray-200 text-black flex items-center gap-2 animate-pulse'>
                <Spinner className='size-4 animate-spin' />
                <span className='text-sm'>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>


      { /* Footer Section*/}
      <div className='flex shrink-0 items-center gap-2 border-t p-3'>
        <textarea
        value={input}
        placeholder='Type your message here...'
        className='flex-1 resize-none border rounded-lg
        px-3 py-2  focus:outline-none focus:ring-2'
        onChange={(event) => setInput(event.target.value)}
        />
        <Button onClick={handleSendMessage} disabled={loading} className="bg-black text-white hover:bg-black/90"> <ArrowUp/> </Button>

      </div>

    </div>
  )
}

export default ChatSection