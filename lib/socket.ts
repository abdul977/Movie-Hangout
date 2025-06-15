import {
  MediaElement,
  PlayerState,
  Playlist,
  RoomState,
  UserState,
  ChatMessage,
} from "./types"
import io, { Socket } from "socket.io-client"

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
  const socket = io({
    query: {
      roomId,
    },
    transports: ["polling"],
    path: "/api/socketio",
    upgrade: false,
    rememberUpgrade: false,
    forceNew: true,
    timeout: 20000,
  })

  socket.on("connect", () => {
    console.log("Established polling connection to io server", socket.id)
  })

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
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

  return socket
}
