import { create } from "zustand"
import type { GameState, ChatMessage, TimerState, Move, PieceColor, EngineAnalysis, AIModel } from "./types"

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

interface GameStore extends GameState {
  // Game state actions
  setFen: (fen: string) => void
  setTurn: (turn: PieceColor) => void
  setIsThinking: (isThinking: boolean) => void
  addMove: (move: Move) => void
  setGameStatus: (status: GameState["gameStatus"]) => void
  setPlayerColor: (color: PieceColor) => void
  setSkillLevel: (level: GameState["skillLevel"]) => void
  setAIModel: (model: AIModel) => void
  resetGame: () => void
  togglePause: () => void
  isPaused: boolean

  // Chat state
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  clearMessages: () => void

  // Timer state
  timer: TimerState
  setTimerActive: (color: PieceColor | null) => void
  decrementTimer: (color: PieceColor) => void
  resetTimers: () => void
  pauseTimer: () => void
  resumeTimer: (color: PieceColor) => void

  // Engine analysis
  analysis: EngineAnalysis | null
  setAnalysis: (analysis: EngineAnalysis | null) => void

  // UI state
  showSetupModal: boolean
  setShowSetupModal: (show: boolean) => void
  selectedSquare: string | null
  setSelectedSquare: (square: string | null) => void
  legalMoves: string[]
  setLegalMoves: (moves: string[]) => void

  reasoningText: string
  setReasoningText: (text: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial game state
  fen: INITIAL_FEN,
  turn: "w",
  isThinking: false,
  moveHistory: [],
  gameStatus: "idle",
  playerColor: "w",
  skillLevel: "club",
  aiModel: "default",
  isPaused: false,

  // Game state actions
  setFen: (fen) => set({ fen }),
  setTurn: (turn) => set({ turn }),
  setIsThinking: (isThinking) => set({ isThinking }),
  addMove: (move) =>
    set((state) => ({
      moveHistory: [...state.moveHistory, move],
    })),
  setGameStatus: (gameStatus) => set({ gameStatus }),
  setPlayerColor: (playerColor) => set({ playerColor }),
  setSkillLevel: (skillLevel) => set({ skillLevel }),
  setAIModel: (aiModel) => set({ aiModel }),

  togglePause: () => {
    const state = get()
    if (state.gameStatus === "paused") {
      set({ gameStatus: "active", isPaused: false })
    } else if (state.gameStatus === "active") {
      set({ gameStatus: "paused", isPaused: true })
    }
  },

  resetGame: () =>
    set({
      fen: INITIAL_FEN,
      turn: "w",
      isThinking: false,
      moveHistory: [],
      gameStatus: "idle",
      analysis: null,
      selectedSquare: null,
      legalMoves: [],
      isPaused: false,
      reasoningText: "",
    }),

  // Chat state
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  // Timer state (10 minutes default)
  timer: {
    white: 600,
    black: 600,
    isRunning: false,
    activeColor: null,
  },
  setTimerActive: (color) =>
    set((state) => ({
      timer: { ...state.timer, activeColor: color, isRunning: color !== null },
    })),
  decrementTimer: (color) =>
    set((state) => ({
      timer: {
        ...state.timer,
        [color === "w" ? "white" : "black"]: Math.max(0, state.timer[color === "w" ? "white" : "black"] - 1),
      },
    })),
  resetTimers: () =>
    set({
      timer: { white: 600, black: 600, isRunning: false, activeColor: null },
    }),
  pauseTimer: () =>
    set((state) => ({
      timer: { ...state.timer, isRunning: false },
    })),
  resumeTimer: (color) =>
    set((state) => ({
      timer: { ...state.timer, isRunning: true, activeColor: color },
    })),

  // Engine analysis
  analysis: null,
  setAnalysis: (analysis) => set({ analysis }),

  // UI state
  showSetupModal: true,
  setShowSetupModal: (showSetupModal) => set({ showSetupModal }),
  selectedSquare: null,
  setSelectedSquare: (selectedSquare) => set({ selectedSquare }),
  legalMoves: [],
  setLegalMoves: (legalMoves) => set({ legalMoves }),

  reasoningText: "",
  setReasoningText: (reasoningText) => set({ reasoningText }),
}))
