"use client"

import { useGameStore } from "@/lib/store"
import { Brain, Loader2 } from "lucide-react"

export function ThinkingIndicator() {
  const { isThinking, reasoningText } = useGameStore()

  if (!isThinking) return null

  return (
    <div className="h-auto min-h-[60px] flex flex-col items-center justify-center gap-2 py-3 border-t border-zinc-200 bg-zinc-50/90 backdrop-blur-sm transition-opacity duration-100">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="animate-pulse-ring">
            <Brain className="w-5 h-5 text-zinc-700" strokeWidth={2} />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <Loader2 className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          </div>
        </div>
        <span className="text-sm font-mono text-zinc-600">Reasoning...</span>
      </div>
      {reasoningText && (
        <div className="text-xs font-mono text-zinc-500 px-4 text-center max-w-full truncate italic">
          {reasoningText}
        </div>
      )}
    </div>
  )
}
