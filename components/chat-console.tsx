"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { useGameStore } from "@/lib/store"
import { ChevronRight, Terminal } from "lucide-react"
import { ThinkingIndicator } from "./thinking-indicator"

interface ChatConsoleProps {
  onCommand: (command: string) => void
}

export function ChatConsole({ onCommand }: ChatConsoleProps) {
  const { messages, isThinking } = useGameStore()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isThinking) return

      onCommand(input.trim())
      setInput("")
    },
    [input, isThinking, onCommand],
  )

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case "CRITIQUE":
        return "text-amber-600"
      case "AGENT":
        return "text-[var(--accent-primary)]"
      case "TIP":
        return "text-emerald-600"
      case "SYSTEM":
        return "text-[var(--text-muted)]"
      default:
        return "text-[var(--text-mono)]"
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b-2 border-[var(--divider)]">
        <form onSubmit={handleSubmit} className="flex items-center h-[50px] px-3 gap-2">
          <Terminal className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="> Ask for strategy or advice..."
            disabled={isThinking}
            className="flex-1 bg-transparent text-[var(--text-primary)] font-mono text-sm 
                       placeholder:text-[var(--text-muted)] focus:outline-none
                       disabled:opacity-50"
          />
          <ChevronRight
            className={`w-4 h-4 transition-colors ${input ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[var(--bg-primary)]">
        {messages.length === 0 && (
          <div className="text-[var(--text-muted)] text-sm font-mono text-center py-8">
            <p>Welcome to Chesso</p>
            <p className="text-xs mt-2">Ask for strategy or advice from the AI agent</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`
              text-sm leading-relaxed
              ${
                message.type === "user"
                  ? "text-[var(--text-primary)]"
                  : "font-mono text-[var(--text-mono)] border-l-2 border-[var(--accent-primary)] pl-3 bg-[var(--bg-surface)] py-2 pr-2 rounded-r-sm"
              }
              ${message.type === "system" ? "text-[var(--text-muted)] text-xs bg-transparent border-l-0 pl-0" : ""}
            `}
          >
            {message.tag && <span className={`${getTagColor(message.tag)} font-bold mr-2`}>[{message.tag}]</span>}
            {message.type === "user" && <span className="text-[var(--text-muted)] mr-2">{">"}</span>}
            <span className="whitespace-pre-wrap">{message.content}</span>
            {message.move && <span className="ml-2 text-[var(--accent-primary)] font-mono">{message.move}</span>}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <ThinkingIndicator />
    </div>
  )
}
