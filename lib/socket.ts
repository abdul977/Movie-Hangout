import {
  MediaElement,
  PlayerState,
  Playlist,
  RoomState,
  UserState,
  ChatMessage,
} from "./types"
import io, { Socket } from "socket.io-client"
import { createFallbackSocket } from "./socket-fallback"

export interface ServerToClientEvents {
  playlistUpdate: (playlist: Playlist) => void
  userUpdates: (users: UserState[]) => void
  update: (room: RoomState) => void
  chatMessage: (message: ChatMessage) => void
  chatHistory: (messages: ChatMessage[]) => void
  userTyping: (userId: string, userName: string, isTyping: boolean) => void
}

export interface ClientToServerEvents {
  playItemFromPlaylist: (index: number) => void
  updatePlaylist: (playlist: Playlist) => void
  updatePlayer: (player: PlayerState) => void
  updatePlaying: (playing: MediaElement) => void
  updateUser: (user: UserState) => void

  setPaused: (paused: boolean) => void
  setLoop: (loop: boolean) => void
  setProgress: (progress: number) => void
  setPlaybackRate: (playbackRate: number) => void

  seek: (progress: number) => void
  playUrl: (src: string) => void
  playAgain: () => void
  playEnded: () => void
  fetch: () => void
  error: () => void

  // Chat events
  sendChatMessage: (message: string) => void
  requestChatHistory: () => void
  setTyping: (isTyping: boolean) => void
}

export function playItemFromPlaylist(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  playlist: Playlist,
  index: number
) {
  if (
    typeof playlist.items[index] === "undefined" ||
    playlist.items[index] === null
  ) {
    console.error("Impossible to play", index, "from", playlist)
    return
  }
  socket.emit("playItemFromPlaylist", index)
}

export function createClientSocket(roomId: string) {
  console.log("Trying to join room", roomId)

  // Check if we should use fallback mode
  const useFallback = process.env.NEXT_PUBLIC_USE_FALLBACK === 'true'

  if (useFallback) {
    console.log("Using fallback socket mode")
    return createFallbackSocket(roomId) as any
  }

  // Use external socket server for production, local for development
  const socketUrl = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SOCKET_URL || 'https://your-socket-server.railway.app'
    : 'http://localhost:3001'

  const socket = io(socketUrl, {
    query: {
      roomId,
    },
    transports: ["polling", "websocket"],
    path: "/socket.io",
    upgrade: true,
    rememberUpgrade: false,
    forceNew: true,
    timeout: 20000,
  })

  socket.on("connect", () => {
    console.log("Established polling connection to io server", socket.id)
  })

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
    console.error("Error details:", {
      message: error.message,
      type: error.type,
      description: error.description
    })
  })

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason)
    if (!["io client disconnect", "io server disconnect"].includes(reason)) {
      console.error(
        "Socket connection closed due to:",
        reason,
        "socket:",
        socket
      )
    }
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })

  return socket
}
