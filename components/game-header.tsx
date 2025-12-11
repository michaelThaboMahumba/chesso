"use client"

import { useEffect } from "react"
import { useGameStore } from "@/lib/store"
import { ChevronRight, Pause, Play, RotateCcw } from "lucide-react"

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function GameHeader() {
  const {
    timer,
    turn,
    gameStatus,
    decrementTimer,
    playerColor,
    togglePause,
    isPaused,
    setShowSetupModal,
    resetGame,
    clearMessages,
    resetTimers,
  } = useGameStore()

  useEffect(() => {
    if (gameStatus !== "active" || isPaused || !timer.isRunning || !timer.activeColor) return

    const interval = setInterval(() => {
      decrementTimer(timer.activeColor!)
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStatus, isPaused, timer.isRunning, timer.activeColor, decrementTimer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement) return

      if (e.code === "Space" && gameStatus !== "idle") {
        e.preventDefault()
        togglePause()
      }
      if (e.code === "KeyR" && e.shiftKey) {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStatus, togglePause])

  const handleReset = () => {
    resetGame()
    clearMessages()
    resetTimers()
    setShowSetupModal(true)
  }

  const isPlayerTurn = turn === playerColor
  const statusText =
    gameStatus === "idle"
      ? "Play chess with AI agent • Ready"
      : gameStatus === "paused"
        ? "PAUSED (Space to resume)"
        : gameStatus === "checkmate"
          ? `Checkmate! ${turn === "w" ? "Black" : "White"} wins`
          : gameStatus === "check"
            ? `${turn === "w" ? "White" : "Black"} is in check`
            : gameStatus === "stalemate"
              ? "Stalemate - Draw"
              : gameStatus === "draw"
                ? "Game drawn"
                : `${isPlayerTurn ? "Your" : "Agent's"} turn`

  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b-2 border-[var(--divider)] flex items-center justify-between px-4">
      {/* AI Timer */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-chesso ${
            timer.activeColor && timer.activeColor !== playerColor && !isPaused
              ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30"
              : "bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">AI Agent</span>
          <span className="font-mono font-bold text-[var(--text-primary)]">
            {formatTime(playerColor === "w" ? timer.black : timer.white)}
          </span>
        </div>
      </div>

      {/* Status + Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-2 rounded-sm hover:bg-[var(--bg-primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Reset Game (Shift+R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={togglePause}
            disabled={gameStatus === "idle" || gameStatus === "checkmate"}
            className="p-2 rounded-sm hover:bg-[var(--bg-primary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
            title="Pause/Resume (Space)"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <ChevronRight className="w-4 h-4 text-[var(--accent-primary)]" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Player Timer */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-chesso ${
            timer.activeColor === playerColor && !isPaused
              ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30"
              : "bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">You</span>
          <span className="font-mono font-bold text-[var(--text-primary)]">
            {formatTime(playerColor === "w" ? timer.white : timer.black)}
          </span>
        </div>
      </div>
    </header>
  )
}
