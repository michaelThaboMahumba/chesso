"use client"

import type React from "react"

import { useCallback, useMemo, useRef, useState } from "react"
import { useGameStore } from "@/lib/store"
import { Chess } from "chess.js"
import { getLegalMoves, getPieceAt } from "@/lib/chess-engine"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const PIECE_UNICODE: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
}

interface ChessBoardProps {
  onMove: (from: string, to: string) => void
}

export function ChessBoard({ onMove }: ChessBoardProps) {
  const {
    fen,
    playerColor,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves,
    turn,
    gameStatus,
    isThinking,
    moveHistory,
  } = useGameStore()
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)

  const chess = useMemo(() => new Chess(fen), [fen])
  const isFlipped = playerColor === "b"

  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null

  const displayFiles = isFlipped ? [...FILES].reverse() : FILES
  const displayRanks = isFlipped ? [...RANKS].reverse() : RANKS

  const handleSquareClick = useCallback(
    (square: string) => {
      if (gameStatus === "idle" || gameStatus === "checkmate" || gameStatus === "stalemate" || gameStatus === "draw")
        return
      if (isThinking) return
      if (turn !== playerColor) return

      const piece = getPieceAt(chess, square)

      if (selectedSquare) {
        if (legalMoves.includes(square)) {
          onMove(selectedSquare, square)
          setSelectedSquare(null)
          setLegalMoves([])
        } else if (piece && piece.color === playerColor) {
          setSelectedSquare(square)
          setLegalMoves(getLegalMoves(chess, square))
        } else {
          setSelectedSquare(null)
          setLegalMoves([])
        }
      } else if (piece && piece.color === playerColor) {
        setSelectedSquare(square)
        setLegalMoves(getLegalMoves(chess, square))
      }
    },
    [
      chess,
      selectedSquare,
      legalMoves,
      playerColor,
      turn,
      gameStatus,
      isThinking,
      onMove,
      setSelectedSquare,
      setLegalMoves,
    ],
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent | React.TouchEvent, square: string) => {
      if (gameStatus === "idle" || isThinking || turn !== playerColor) return

      const piece = getPieceAt(chess, square)
      if (!piece || piece.color !== playerColor) return

      setDraggedPiece(square)
      setSelectedSquare(square)
      setLegalMoves(getLegalMoves(chess, square))

      if ("dataTransfer" in e) {
        e.dataTransfer.effectAllowed = "move"
        const img = new Image()
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        e.dataTransfer.setDragImage(img, 0, 0)
      }
    },
    [chess, playerColor, turn, gameStatus, isThinking, setSelectedSquare, setLegalMoves],
  )

  const handleDrag = useCallback((e: React.DragEvent | React.TouchEvent) => {
    if (!boardRef.current) return

    let clientX: number, clientY: number
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = boardRef.current.getBoundingClientRect()
    setDragPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })
  }, [])

  const handleDrop = useCallback(
    (square: string) => {
      if (draggedPiece && legalMoves.includes(square)) {
        onMove(draggedPiece, square)
      }
      setDraggedPiece(null)
      setSelectedSquare(null)
      setLegalMoves([])
    },
    [draggedPiece, legalMoves, onMove, setSelectedSquare, setLegalMoves],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
  }, [])

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div ref={boardRef} className="relative aspect-square w-full max-w-[min(65vh,600px)] select-none">
        {/* Board grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-2 border-[var(--divider)] shadow-lg">
          {displayRanks.map((rank, rankIndex) =>
            displayFiles.map((file, fileIndex) => {
              const square = `${file}${rank}`
              const isLight = (rankIndex + fileIndex) % 2 === 0
              const piece = getPieceAt(chess, square)
              const isSelected = selectedSquare === square
              const isLegalMove = legalMoves.includes(square)
              const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square)
              const isDragging = draggedPiece === square

              const pieceKey = piece ? `${piece.color}${piece.type}` : null

              return (
                <div
                  key={square}
                  className={`
                    relative flex items-center justify-center cursor-pointer
                    transition-chesso
                    ${isLight ? "bg-[var(--board-light)]" : "bg-[var(--board-dark)]"}
                    ${isSelected ? "ring-2 ring-inset ring-[var(--accent-primary)]" : ""}
                    ${isLastMoveSquare ? "bg-[var(--board-highlight)]" : ""}
                  `}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(square)}
                >
                  {/* Coordinate labels */}
                  {fileIndex === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-mono ${
                        isLight ? "text-[var(--board-dark)]" : "text-[var(--board-light)]"
                      } opacity-70`}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIndex === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-mono ${
                        isLight ? "text-[var(--board-dark)]" : "text-[var(--board-light)]"
                      } opacity-70`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal move indicator */}
                  {isLegalMove && !piece && (
                    <div className="absolute w-3 h-3 rounded-full bg-[var(--accent-primary)] opacity-40" />
                  )}
                  {isLegalMove && piece && (
                    <div className="absolute inset-1 rounded-sm border-2 border-[var(--accent-primary)] opacity-60" />
                  )}

                  {/* Piece */}
                  {pieceKey && !isDragging && (
                    <span
                      className={`text-4xl md:text-5xl leading-none select-none cursor-grab active:cursor-grabbing
                        ${piece?.color === "w" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]"}
                        ${turn === playerColor && piece?.color === playerColor ? "hover:scale-110 transition-transform" : ""}
                      `}
                      draggable={piece?.color === playerColor && turn === playerColor && gameStatus === "active"}
                      onDragStart={(e) => handleDragStart(e, square)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                    >
                      {PIECE_UNICODE[pieceKey]}
                    </span>
                  )}
                </div>
              )
            }),
          )}
        </div>

        {/* Dragged piece overlay */}
        {draggedPiece && (
          <div
            className="absolute pointer-events-none z-50 text-5xl"
            style={{
              left: dragPosition.x - 24,
              top: dragPosition.y - 24,
            }}
          >
            {(() => {
              const piece = getPieceAt(chess, draggedPiece)
              if (!piece) return null
              const key = `${piece.color}${piece.type}`
              return (
                <span
                  className={
                    piece.color === "w"
                      ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                      : "text-zinc-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]"
                  }
                >
                  {PIECE_UNICODE[key]}
                </span>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
