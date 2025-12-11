import { Chess, type Square as ChessSquare } from "chess.js"
import type { Move, PieceColor, EngineAnalysis } from "./types"

// Chess.js wrapper for game logic
export function createChessInstance(fen?: string): Chess {
  return new Chess(fen)
}

export function validateMove(chess: Chess, from: string, to: string): Move | null {
  try {
    const move = chess.move({ from: from as ChessSquare, to: to as ChessSquare, promotion: "q" })
    if (move) {
      chess.undo() // Don't actually make the move, just validate
      return {
        from,
        to,
        san: move.san,
        captured: move.captured as any,
        promotion: move.promotion as any,
      }
    }
  } catch {
    return null
  }
  return null
}

export function makeMove(chess: Chess, from: string, to: string, promotion?: string): Move | null {
  try {
    const move = chess.move({
      from: from as ChessSquare,
      to: to as ChessSquare,
      promotion: (promotion || "q") as any,
    })
    if (move) {
      return {
        from,
        to,
        san: move.san,
        captured: move.captured as any,
        promotion: move.promotion as any,
      }
    }
  } catch {
    return null
  }
  return null
}

export function getLegalMoves(chess: Chess, square: string): string[] {
  const moves = chess.moves({ square: square as ChessSquare, verbose: true })
  return moves.map((m) => m.to)
}

export function getGameStatus(chess: Chess): "active" | "check" | "checkmate" | "stalemate" | "draw" {
  if (chess.isCheckmate()) return "checkmate"
  if (chess.isStalemate()) return "stalemate"
  if (chess.isDraw()) return "draw"
  if (chess.inCheck()) return "check"
  return "active"
}

export function getPieceAt(chess: Chess, square: string): { type: string; color: PieceColor } | null {
  const piece = chess.get(square as ChessSquare)
  return piece ? { type: piece.type, color: piece.color as PieceColor } : null
}

// Stockfish WASM integration
let stockfishWorker: Worker | null = null
let resolveAnalysis: ((analysis: EngineAnalysis) => void) | null = null

export function initStockfish(): Promise<void> {
  return new Promise((resolve) => {
    if (stockfishWorker) {
      resolve()
      return
    }

    // Use the Stockfish.js WASM build from CDN
    stockfishWorker = new Worker("/stockfish.js")

    stockfishWorker.onmessage = (e) => {
      const message = e.data

      if (message === "uciok") {
        stockfishWorker?.postMessage("isready")
      } else if (message === "readyok") {
        resolve()
      } else if (typeof message === "string" && message.startsWith("bestmove")) {
        const bestMove = message.split(" ")[1]
        if (resolveAnalysis && bestMove) {
          resolveAnalysis({
            bestMove,
            evaluation: 0,
            depth: 15,
            pv: [bestMove],
          })
          resolveAnalysis = null
        }
      } else if (typeof message === "string" && message.startsWith("info")) {
        // Parse info strings for evaluation
        const depthMatch = message.match(/depth (\d+)/)
        const scoreMatch = message.match(/score cp (-?\d+)/)
        const mateMatch = message.match(/score mate (-?\d+)/)
        const pvMatch = message.match(/pv (.+)/)

        if (depthMatch && (scoreMatch || mateMatch)) {
          // Update partial analysis - could emit events here
        }
      }
    }

    stockfishWorker.postMessage("uci")
  })
}

export function analyzePosition(fen: string, depth = 15): Promise<EngineAnalysis> {
  return new Promise((resolve, reject) => {
    if (!stockfishWorker) {
      // Fallback to simple random move if no engine
      reject(new Error("Stockfish not initialized"))
      return
    }

    resolveAnalysis = resolve
    stockfishWorker.postMessage(`position fen ${fen}`)
    stockfishWorker.postMessage(`go depth ${depth}`)

    // Timeout after 10 seconds
    setTimeout(() => {
      if (resolveAnalysis) {
        reject(new Error("Engine timeout"))
        resolveAnalysis = null
      }
    }, 10000)
  })
}

export function setEngineSkill(level: "novice" | "club" | "grandmaster") {
  if (!stockfishWorker) return

  const skillMap = {
    novice: { skill: 5, depth: 8 },
    club: { skill: 12, depth: 12 },
    grandmaster: { skill: 20, depth: 18 },
  }

  const settings = skillMap[level]
  stockfishWorker.postMessage(`setoption name Skill Level value ${settings.skill}`)
}

// Simple AI move generator (fallback when Stockfish not available)
export function getAIMove(chess: Chess, skillLevel: "novice" | "club" | "grandmaster"): Move | null {
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  // Simple evaluation: captures and checks preferred
  const scoredMoves = moves.map((move) => {
    let score = Math.random() * 10
    if (move.captured) score += 50
    if (move.san.includes("+")) score += 30
    if (move.san.includes("#")) score += 1000
    // Center control bonus
    if (["d4", "d5", "e4", "e5"].includes(move.to)) score += 20
    return { move, score }
  })

  scoredMoves.sort((a, b) => b.score - a.score)

  // Add some randomness based on skill level
  const randomFactor = skillLevel === "novice" ? 0.7 : skillLevel === "club" ? 0.3 : 0.1
  const topMoves = scoredMoves.slice(0, Math.ceil(moves.length * randomFactor) || 1)
  const selected = topMoves[Math.floor(Math.random() * topMoves.length)]

  return {
    from: selected.move.from,
    to: selected.move.to,
    san: selected.move.san,
    captured: selected.move.captured as any,
    promotion: selected.move.promotion as any,
  }
}
