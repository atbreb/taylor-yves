'use client'

import { useState, useRef, useEffect } from 'react'
import { streamAgentResponseAction } from '@/app/actions'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: Array<{
    tool: string
    input: string
    output: string
  }>
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: []
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      for await (const response of streamAgentResponseAction(input, conversationId)) {
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          
          if (response.event) {
            if (response.event.chunk) {
              lastMessage.content += response.event.chunk
            } else if (response.event.tool_call) {
              lastMessage.toolCalls?.push({
                tool: response.event.tool_call.tool_name,
                input: response.event.tool_call.tool_input,
                output: response.event.tool_call.tool_output
              })
            } else if (response.event.thought) {
              // Handle agent thinking (could show in UI)
              console.log('Agent thinking:', response.event.thought)
            } else if (response.event.error) {
              lastMessage.content += `\n\nError: ${response.event.error}`
            }
          }
          
          return newMessages
        })
      }
    } catch (error) {
      console.error('Stream error:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        lastMessage.content = 'Sorry, an error occurred while processing your request.'
        return newMessages
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-2">Ask me anything about your data or let me help you with analysis.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/20">
                    <p className="text-xs font-medium mb-2 opacity-70">Tools Used:</p>
                    {message.toolCalls.map((call, idx) => (
                      <div key={idx} className="text-xs mb-2 p-2 bg-black/10 rounded">
                        <p className="font-medium">{call.tool}</p>
                        <p className="opacity-70 mt-1">Input: {call.input}</p>
                        {call.output && (
                          <p className="opacity-70 mt-1">Output: {call.output}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timestamp */}
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}