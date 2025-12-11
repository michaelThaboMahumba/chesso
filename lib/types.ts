export type PieceType = "p" | "n" | "b" | "r" | "q" | "k"
export type PieceColor = "w" | "b"
export type Piece = `${PieceColor}${PieceType}` | null

export type Square = string // e.g., 'e4', 'a1'

export type AIModel = "default" | "claude" | "gpt" | "grok" | "mistral" | "gemini"

export interface Move {
  from: Square
  to: Square
  promotion?: PieceType
  san?: string
  captured?: PieceType
  piece?: PieceType
}

export interface GameState {
  fen: string
  turn: PieceColor
  isThinking: boolean
  moveHistory: Move[]
  gameStatus: "idle" | "active" | "check" | "checkmate" | "stalemate" | "draw" | "paused"
  playerColor: PieceColor
  skillLevel: "novice" | "club" | "grandmaster"
  aiModel: AIModel
}

export interface ChatMessage {
  id: string
  type: "user" | "agent" | "system"
  tag?: "CRITIQUE" | "AGENT" | "TIP" | "SYSTEM"
  content: string
  timestamp: Date
  move?: string
}

export interface TimerState {
  white: number // seconds remaining
  black: number
  isRunning: boolean
  activeColor: PieceColor | null
}

export interface EngineAnalysis {
  bestMove: string
  evaluation: number // centipawns
  depth: number
  pv: string[] // principal variation
  mate?: number
}
