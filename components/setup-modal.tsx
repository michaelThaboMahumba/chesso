"use client"

import type React from "react"

import { useState } from "react"
import { useGameStore } from "@/lib/store"
import type { PieceColor, AIModel } from "@/lib/types"
import { Claude, OpenAI, Gemini, Mistral } from "@lobehub/icons"
import { Bot, Zap } from "lucide-react"

const AI_MODELS: { value: AIModel; label: string; icon: React.ReactNode }[] = [
  { value: "default", label: "Default", icon: <Bot className="w-5 h-5" /> },
  { value: "claude", label: "Claude", icon: <Claude size={20} /> },
  { value: "gpt", label: "GPT", icon: <OpenAI size={20} /> },
  { value: "grok", label: "Grok", icon: <Zap className="w-5 h-5" /> },
  { value: "mistral", label: "Mistral", icon: <Mistral size={20} /> },
  { value: "gemini", label: "Gemini 3", icon: <Gemini size={20} /> },
]

export function SetupModal() {
  const {
    showSetupModal,
    setShowSetupModal,
    setPlayerColor,
    setSkillLevel,
    setAIModel,
    setGameStatus,
    addMessage,
    resetGame,
    resetTimers,
    setTimerActive,
  } = useGameStore()
  const [selectedSkill, setSelectedSkill] = useState<"novice" | "club" | "grandmaster">("club")
  const [selectedSide, setSelectedSide] = useState<PieceColor>("w")
  const [selectedModel, setSelectedModel] = useState<AIModel>("default")

  if (!showSetupModal) return null

  const handleStart = () => {
    resetGame()
    resetTimers()
    setPlayerColor(selectedSide)
    setSkillLevel(selectedSkill)
    setAIModel(selectedModel)
    setGameStatus("active")
    setShowSetupModal(false)

    if (selectedSide === "w") {
      setTimerActive("w")
    }

    addMessage({
      type: "system",
      tag: "SYSTEM",
      content: `Game started. You play as ${selectedSide === "w" ? "White" : "Black"}. AI: ${selectedModel.toUpperCase()} (${selectedSkill}).`,
    })

    if (selectedSide === "b") {
      addMessage({
        type: "agent",
        tag: "AGENT",
        content:
          "I have the first move. Let me analyze the opening and choose a classical approach to establish control of the center.",
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[24px]" onClick={() => {}} />

      <div className="relative z-10 w-full max-w-md mx-4 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-sm overflow-hidden shadow-2xl shadow-black/20">
        <div className="px-6 py-5 border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100/80">
          <div className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-1">▸ CHESSO v1.0</div>
          <h2 className="text-xl font-semibold text-zinc-900">New Game Setup</h2>
          <div className="mt-3 px-3 py-2 bg-zinc-900 rounded-sm border border-zinc-700">
            <p
              className="text-xs font-mono text-emerald-400 tracking-wide"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {">"} Learn and play chess with Frontier models_
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 bg-white/80">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AI Model</label>
            <div className="grid grid-cols-3 gap-2">
              {AI_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => setSelectedModel(model.value)}
                  className={`
                    px-3 py-3 text-xs font-mono transition-all duration-200 rounded-sm flex flex-col items-center gap-1.5
                    ${
                      selectedModel === model.value
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/30"
                        : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border border-zinc-200"
                    }
                  `}
                >
                  <span className={selectedModel === model.value ? "text-white" : "text-zinc-700"}>{model.icon}</span>
                  <span className="text-[10px] uppercase tracking-wide">{model.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Skill Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(["novice", "club", "grandmaster"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedSkill(level)}
                  className={`
                    px-4 py-2.5 text-xs font-medium capitalize transition-all duration-200 rounded-sm
                    ${
                      selectedSkill === level
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/30"
                        : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border border-zinc-200"
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Play As</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["w", "White"],
                  ["b", "Black"],
                ] as const
              ).map(([color, label]) => (
                <button
                  key={color}
                  onClick={() => setSelectedSide(color)}
                  className={`
                    px-4 py-3 text-sm font-medium transition-all duration-200 rounded-sm flex items-center justify-center gap-2
                    ${
                      selectedSide === color
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/30"
                        : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border border-zinc-200"
                    }
                  `}
                >
                  <span
                    className={`text-2xl ${color === "w" ? (selectedSide === color ? "text-white" : "text-zinc-400") : selectedSide === color ? "text-zinc-400" : "text-zinc-800"}`}
                  >
                    {color === "w" ? "♔" : "♚"}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/80">
          <button
            onClick={handleStart}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm uppercase tracking-wider transition-all duration-200 rounded-sm shadow-lg shadow-zinc-900/30 active:scale-[0.98]"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  )
}
