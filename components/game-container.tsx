"use client"

import type React from "react"

import { useCallback, useMemo, useEffect, useState, useRef } from "react"
import { Chess } from "chess.js"
import { useGameStore } from "@/lib/store"
import { GameHeader } from "./game-header"
import { ChessBoard } from "./chess-board"
import { ChatConsole } from "./chat-console"
import { SetupModal } from "./setup-modal"
import { makeMove, getGameStatus, getAIMove } from "@/lib/chess-engine"
import { playMoveSound, playCheckmateSound, playThinkingDoneSound, preloadSounds } from "@/lib/sounds"

const REASONING_STEPS = [
  "Analyzing board position...",
  "Evaluating piece activity...",
  "Calculating best continuation...",
  "Checking tactical patterns...",
  "Assessing pawn structure...",
  "Finalizing move decision...",
]

const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
}

export function GameContainer() {
  const {
    fen,
    setFen,
    turn,
    setTurn,
    playerColor,
    skillLevel,
    aiModel,
    gameStatus,
    setGameStatus,
    isThinking,
    setIsThinking,
    addMove,
    addMessage,
    setShowSetupModal,
    setTimerActive,
    isPaused,
    setReasoningText,
  } = useGameStore()

  const chess = useMemo(() => new Chess(fen), [fen])

  const [leftPaneWidth, setLeftPaneWidth] = useState(35)
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  useEffect(() => {
    preloadSounds()
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      setLeftPaneWidth(Math.min(50, Math.max(20, newWidth)))
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const makeAIMove = useCallback(async () => {
    if (turn === playerColor || gameStatus !== "active" || isPaused) return

    setIsThinking(true)
    setTimerActive(turn)

    for (let i = 0; i < REASONING_STEPS.length; i++) {
      setReasoningText(REASONING_STEPS[i])
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))
    }

    const aiMove = getAIMove(chess, skillLevel)

    if (aiMove) {
      const result = makeMove(chess, aiMove.from, aiMove.to, aiMove.promotion)

      if (result) {
        // Play thinking done sound first
        await playThinkingDoneSound()

        setFen(chess.fen())
        setTurn(chess.turn() as "w" | "b")
        addMove({ ...result, piece: aiMove.piece })

        const status = getGameStatus(chess)
        setGameStatus(status)

        await playMoveSound(!!result.captured, status === "check")

        const pieceName = PIECE_NAMES[aiMove.piece || "p"]
        const commentary = generateAICommentary(result, status, chess, pieceName, aiModel)
        addMessage({
          type: "agent",
          tag: "AGENT",
          content: commentary,
          move: result.san,
        })

        if (status === "checkmate") {
          await playCheckmateSound()
          setTimerActive(null)
          addMessage({
            type: "system",
            tag: "SYSTEM",
            content: `Game over. ${turn === playerColor ? "You lose." : "You win!"}`,
          })
        } else {
          setTimerActive(playerColor)
        }
      }
    }

    setReasoningText("")
    setIsThinking(false)
  }, [
    chess,
    turn,
    playerColor,
    skillLevel,
    aiModel,
    gameStatus,
    isPaused,
    setFen,
    setTurn,
    setIsThinking,
    addMove,
    addMessage,
    setGameStatus,
    setTimerActive,
    setReasoningText,
  ])

  useEffect(() => {
    if (turn !== playerColor && gameStatus === "active" && !isThinking && !isPaused) {
      const timeout = setTimeout(makeAIMove, 500)
      return () => clearTimeout(timeout)
    }
  }, [turn, playerColor, gameStatus, isThinking, isPaused, makeAIMove])

  const handlePlayerMove = useCallback(
    async (from: string, to: string) => {
      if (turn !== playerColor || gameStatus !== "active" || isPaused) return

      const result = makeMove(chess, from, to)

      if (result) {
        setTimerActive(null)

        setFen(chess.fen())
        setTurn(chess.turn() as "w" | "b")
        addMove(result)

        const status = getGameStatus(chess)
        setGameStatus(status)

        await playMoveSound(!!result.captured, status === "check" || status === "checkmate")

        addMessage({
          type: "user",
          content: `Played ${result.san}`,
          move: result.san,
        })

        const critique = generateCritique(result, chess)
        if (critique) {
          addMessage({
            type: "agent",
            tag: "CRITIQUE",
            content: critique,
          })
        }

        if (status === "checkmate") {
          await playCheckmateSound()
          setTimerActive(null)
          addMessage({
            type: "system",
            tag: "SYSTEM",
            content: `Checkmate! ${turn === "w" ? "White" : "Black"} wins.`,
          })
        } else if (status === "check") {
          addMessage({
            type: "agent",
            tag: "TIP",
            content: "Check!",
          })
        }
      }
    },
    [
      chess,
      turn,
      playerColor,
      gameStatus,
      isPaused,
      setFen,
      setTurn,
      addMove,
      addMessage,
      setGameStatus,
      setTimerActive,
    ],
  )

  const handleCommand = useCallback(
    (command: string) => {
      const lowerCmd = command.toLowerCase().trim()

      if (lowerCmd === "new" || lowerCmd === "reset") {
        setShowSetupModal(true)
        return
      }

      if (lowerCmd === "help") {
        addMessage({
          type: "agent",
          tag: "TIP",
          content: 'Commands: "new", "hint". Or ask strategy questions!',
        })
        return
      }

      if (lowerCmd === "hint" || lowerCmd === "suggest") {
        if (gameStatus !== "active" || turn !== playerColor) {
          addMessage({
            type: "agent",
            tag: "TIP",
            content: "Wait for your turn.",
          })
          return
        }

        const hintMove = getAIMove(chess, "grandmaster")
        if (hintMove) {
          addMessage({
            type: "agent",
            tag: "TIP",
            content: `Try ${hintMove.san}.`,
          })
        }
        return
      }

      addMessage({
        type: "user",
        content: command,
      })

      addMessage({
        type: "agent",
        tag: "AGENT",
        content: getStrategicResponse(command, chess, aiModel),
      })
    },
    [chess, gameStatus, turn, playerColor, aiModel, addMessage, setShowSetupModal],
  )

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <GameHeader />

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        <div
          className="min-w-[280px] flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]"
          style={{ width: `${leftPaneWidth}%` }}
        >
          <ChatConsole onCommand={handleCommand} />
        </div>

        <div
          className="resize-handle w-1 bg-[var(--divider)] hover:bg-[var(--accent-primary)] transition-colors cursor-col-resize"
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 bg-[var(--bg-primary)]">
          <ChessBoard onMove={handlePlayerMove} />
        </div>
      </div>

      <SetupModal />
    </div>
  )
}

function generateAICommentary(
  move: { san?: string; captured?: string },
  status: string,
  chess: Chess,
  pieceName: string,
  model: string,
): string {
  const san = move.san || "move"

  if (status === "checkmate") {
    return `${san} - Checkmate. My ${pieceName} delivers the final blow. A well-fought game - I hope you learned something from our encounter. The position was complex but the checkmate pattern was inevitable once the attack was coordinated.`
  }

  if (status === "check") {
    return `${san} - Check with my ${pieceName}! Your king is under direct attack and must respond immediately. Consider how this check disrupts your coordination and what defensive resources you have available.`
  }

  if (move.captured) {
    return `${san} - I'm capturing with my ${pieceName}. This exchange improves my position by ${
      Math.random() > 0.5 ? "gaining material advantage" : "opening lines for my remaining pieces"
    }. Material imbalances like this often define the character of the middlegame.`
  }

  const longComments = [
    `${san} - Moving my ${pieceName} to strengthen central control. This is a key strategic concept: the side that controls the center can more easily maneuver pieces to both flanks.`,
    `${san} - Developing my ${pieceName} with tempo. In chess, every move should accomplish something - here I'm improving piece activity while maintaining pressure on your position.`,
    `${san} - My ${pieceName} takes an active post. Notice how this coordinates with my other pieces. Harmony between pieces is often more important than individual piece placement.`,
    `${san} - A prophylactic move with my ${pieceName}, preventing your potential threats before they materialize. Defense and attack often go hand in hand in chess.`,
    `${san} - Repositioning my ${pieceName} for the upcoming middlegame complications. The transition between opening and middlegame requires careful piece placement.`,
  ]

  return longComments[Math.floor(Math.random() * longComments.length)]
}

function generateCritique(move: { san?: string; captured?: string }, chess: Chess): string | null {
  if (move.captured) {
    return "Trade noted."
  }

  const critiques = ["Solid.", "Interesting.", "Good development.", null, null, null]

  return critiques[Math.floor(Math.random() * critiques.length)]
}

function getStrategicResponse(question: string, chess: Chess, model: string): string {
  const q = question.toLowerCase()
  const modelName = model === "default" ? "AI" : model.charAt(0).toUpperCase() + model.slice(1)

  if (q.includes("opening") || q.includes("start")) {
    return `[${modelName}] The opening phase is crucial for establishing a solid foundation. Follow these principles: 1) Control the center with pawns (e4, d4, e5, d5 are key squares). 2) Develop knights before bishops - knights have fewer good squares early on. 3) Castle within the first 10 moves to protect your king. 4) Connect your rooks by clearing the back rank. 5) Don't move the same piece twice without good reason. 6) Avoid early queen adventures that waste tempo.`
  }

  if (q.includes("castle") || q.includes("king")) {
    return `[${modelName}] King safety is paramount in chess. Castling serves two purposes: it tucks your king away in the corner behind a pawn shield, and it activates your rook by connecting it to the center. Kingside castling (O-O) is generally safer as it requires moving fewer pieces. Queenside castling (O-O-O) is more aggressive but leaves your king slightly more exposed. A good rule: castle before move 10 unless there's a concrete reason not to.`
  }

  if (q.includes("pawn") || q.includes("structure")) {
    return `[${modelName}] Pawn structure is the skeleton of your position - it determines where your pieces belong and what plans are available. Avoid doubled pawns (two pawns on the same file), isolated pawns (no friendly pawns on adjacent files), and backward pawns (can't advance safely). A pawn chain is strong but should be attacked at its base. Remember: pawns can't move backward, so every pawn move permanently changes the position.`
  }

  if (q.includes("endgame") || q.includes("end game")) {
    return `[${modelName}] Endgame technique separates good players from great ones. Key principles: 1) Activate your king - it becomes a fighting piece when there's less danger. 2) Create passed pawns and push them toward promotion. 3) Rooks belong behind passed pawns (yours or opponent's). 4) In king and pawn endings, opposition is critical - the king that doesn't have to move often wins. 5) The square rule helps calculate if a king can catch a passed pawn.`
  }

  if (q.includes("tactic") || q.includes("pin") || q.includes("fork")) {
    return `[${modelName}] Tactics win games! The main tactical motifs are: FORKS (one piece attacks two), PINS (a piece can't move without exposing a more valuable piece), SKEWERS (like pins but the more valuable piece is in front), DISCOVERED ATTACKS (moving one piece reveals an attack by another), DOUBLE CHECKS (the most forcing moves in chess). Always scan for these patterns, both for you and your opponent. The player who sees tactics first usually wins.`
  }

  return `[${modelName}] Great question! In this position, focus on piece activity and king safety. Every move should have a clear purpose: develop a piece, create a threat, or improve your position. Look for forcing moves (checks, captures, threats) first, then consider quiet improvements. Chess is about small advantages accumulating into winning positions. Keep analyzing and learning from each game!`
}
