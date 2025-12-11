const MOVE_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3"
const CAPTURE_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3"
const CHECK_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3"
const CHECKMATE_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3"
const MISTAKE_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/illegal.mp3"
const THINKING_DONE_SOUND_URL = "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3"

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
  }
  return audioContext
}

const soundCache: Map<string, AudioBuffer> = new Map()

async function loadSound(url: string): Promise<AudioBuffer | null> {
  if (soundCache.has(url)) {
    return soundCache.get(url)!
  }

  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer)
    soundCache.set(url, audioBuffer)
    return audioBuffer
  } catch (error) {
    console.error("Failed to load sound:", error)
    return null
  }
}

async function playSound(url: string): Promise<void> {
  try {
    const ctx = getAudioContext()
    if (ctx.state === "suspended") {
      await ctx.resume()
    }

    const buffer = await loadSound(url)
    if (!buffer) return

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  } catch (error) {
    console.error("Failed to play sound:", error)
  }
}

export async function playMoveSound(isCapture = false, isCheck = false): Promise<void> {
  let url = MOVE_SOUND_URL
  if (isCheck) {
    url = CHECK_SOUND_URL
  } else if (isCapture) {
    url = CAPTURE_SOUND_URL
  }
  await playSound(url)
}

export async function playCheckmateSound(): Promise<void> {
  await playSound(CHECKMATE_SOUND_URL)
}

export async function playMistakeSound(): Promise<void> {
  await playSound(MISTAKE_SOUND_URL)
}

export async function playThinkingDoneSound(): Promise<void> {
  await playSound(THINKING_DONE_SOUND_URL)
}

// Preload sounds
export function preloadSounds(): void {
  loadSound(MOVE_SOUND_URL)
  loadSound(CAPTURE_SOUND_URL)
  loadSound(CHECK_SOUND_URL)
  loadSound(CHECKMATE_SOUND_URL)
  loadSound(MISTAKE_SOUND_URL)
  loadSound(THINKING_DONE_SOUND_URL)
}
