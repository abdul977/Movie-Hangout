import * as socketIo from "socket.io"
import { Server } from "socket.io"
import { NextApiRequest, NextApiResponse } from "next"
import { ClientToServerEvents, ServerToClientEvents } from "../../lib/socket"
import {
  decUsers,
  deleteRoom,
  getRoom,
  incUsers,
  roomExists,
  setRoom,
  addChatMessage,
  getChatHistory,
  addTypingUser,
  removeTypingUser,
  clearChatHistory,
} from "../../lib/cache"
import { createNewRoom, createNewUser, updateLastSync } from "../../lib/room"
import { Playlist, RoomState, UserState, ChatMessage } from "../../lib/types"
import { isUrl } from "../../lib/utils"

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Socket.IO handler called:", req.method, req.url)

  try {
    // @ts-ignore
    if (res.socket !== null && "server" in res.socket && !res.socket.server.io) {
      console.log("*First use, starting socket.io")

      const io = new Server<ClientToServerEvents, ServerToClientEvents>(
        // @ts-ignore
        res.socket.server,
        {
          path: "/api/socketio",
          cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: false
          },
          transports: ['polling'],
          allowEIO3: true,
          pingTimeout: 60000,
          pingInterval: 25000
        }
      )

    const broadcast = async (room: string | RoomState) => {
      const roomId = typeof room === "string" ? room : room.id
      let roomData: RoomState

      if (typeof room !== "string") {
        roomData = room
        await setRoom(roomId, roomData)
      } else {
        const d = await getRoom(roomId)
        if (d === null) {
          throw Error("Impossible room state of null for room: " + roomId)
        }
        roomData = d
      }

      roomData.serverTime = new Date().getTime()
      io.to(roomId).emit("update", roomData)
    }

    io.on(
      "connection",
      async (
        socket: socketIo.Socket<ClientToServerEvents, ServerToClientEvents>
      ) => {
        try {
          console.log("New socket connection:", socket.id, "transport:", socket.conn.transport.name)

          if (
            !("roomId" in socket.handshake.query) ||
            typeof socket.handshake.query.roomId !== "string"
          ) {
            console.log("Invalid roomId, disconnecting socket:", socket.id)
            socket.disconnect()
            return
          }

        const roomId = socket.handshake.query.roomId.toLowerCase()
        const log = (...props: any[]) => {
          console.log(
            "[" + new Date().toUTCString() + "][room " + roomId + "]",
            socket.id,
            ...props
          )
        }

        if (!(await roomExists(roomId))) {
          await createNewRoom(roomId, socket.id)
          log("created room")
        }

        socket.join(roomId)
        await incUsers()
        log("joined")

        await createNewUser(roomId, socket.id)

        // Send join message to chat
        const room = await getRoom(roomId)
        if (room) {
          const user = room.users.find((u: UserState) => u.socketIds[0] === socket.id)
          if (user) {
            const joinMessage: ChatMessage = {
              id: `join-${Date.now()}-${socket.id}`,
              userId: user.uid,
              userName: user.name,
              message: `${user.name} joined the room`,
              timestamp: Date.now(),
              type: 'join'
            }
            await addChatMessage(roomId, joinMessage)
            io.to(roomId).emit("chatMessage", joinMessage)
          }
        }

        socket.on("disconnect", async () => {
          await decUsers()
          log("disconnected")
          const room = await getRoom(roomId)
          if (room === null) return

          // Find the user who's leaving for the leave message
          const leavingUser = room.users.find(
            (user: UserState) => user.socketIds[0] === socket.id
          )

          room.users = room.users.filter(
            (user: UserState) => user.socketIds[0] !== socket.id
          )

          // Send leave message to chat if user was found
          if (leavingUser) {
            const leaveMessage: ChatMessage = {
              id: `leave-${Date.now()}-${socket.id}`,
              userId: leavingUser.uid,
              userName: leavingUser.name,
              message: `${leavingUser.name} left the room`,
              timestamp: Date.now(),
              type: 'leave'
            }
            await addChatMessage(roomId, leaveMessage)

            // Remove from typing users
            await removeTypingUser(roomId, leavingUser.uid)
          }

          if (room.users.length === 0) {
            await deleteRoom(roomId)
            await clearChatHistory(roomId) // Clean up chat when room is empty
            log("deleted empty room and chat history")
          } else {
            if (room.ownerId === socket.id) {
              room.ownerId = room.users[0].uid
            }

            // Broadcast leave message to remaining users
            if (leavingUser) {
              const leaveMessage: ChatMessage = {
                id: `leave-${Date.now()}-${socket.id}`,
                userId: leavingUser.uid,
                userName: leavingUser.name,
                message: `${leavingUser.name} left the room`,
                timestamp: Date.now(),
                type: 'leave'
              }
              io.to(roomId).emit("chatMessage", leaveMessage)
            }

            await broadcast(room)
          }
        })

        socket.on("setPaused", async (paused) => {
          let room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting pause for non existing room:" + roomId)
          }
          log("set paused to", paused)

          room = updateLastSync(room)
          room.targetState.paused = paused
          await broadcast(room)
        })

        socket.on("setLoop", async (loop) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting loop for non existing room:" + roomId)
          }
          log("set loop to", loop)

          room.targetState.loop = loop
          await broadcast(updateLastSync(room))
        })

        socket.on("setProgress", async (progress) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting progress for non existing room:" + roomId)
          }

          room.users = room.users.map((user: UserState) => {
            if (user.socketIds[0] === socket.id) {
              user.player.progress = progress
            }
            return user
          })

          await broadcast(room)
        })

        socket.on("setPlaybackRate", async (playbackRate) => {
          let room = await getRoom(roomId)
          if (room === null) {
            throw new Error(
              "Setting playbackRate for non existing room:" + roomId
            )
          }
          log("set playbackRate to", playbackRate)

          room = updateLastSync(room)
          room.targetState.playbackRate = playbackRate
          await broadcast(room)
        })

        socket.on("seek", async (progress) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting progress for non existing room:" + roomId)
          }
          log("seeking to", progress)

          room.targetState.progress = progress
          room.targetState.lastSync = new Date().getTime() / 1000
          await broadcast(room)
        })

        socket.on("playEnded", async () => {
          let room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Play ended for non existing room:" + roomId)
          }
          log("playback ended")

          if (room.targetState.loop) {
            room.targetState.progress = 0
            room.targetState.paused = false
          } else if (
            room.targetState.playlist.currentIndex + 1 <
            room.targetState.playlist.items.length
          ) {
            room.targetState.playing =
              room.targetState.playlist.items[
                room.targetState.playlist.currentIndex + 1
              ]
            room.targetState.playlist.currentIndex += 1
            room.targetState.progress = 0
            room.targetState.paused = false
          } else {
            room.targetState.progress =
              room.users.find((user: UserState) => user.socketIds[0] === socket.id)?.player
                .progress || 0
            room.targetState.paused = true
          }
          room.targetState.lastSync = new Date().getTime() / 1000
          await broadcast(room)
        })

        socket.on("playAgain", async () => {
          let room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Play again for non existing room:" + roomId)
          }
          log("play same media again")

          room.targetState.progress = 0
          room.targetState.paused = false
          room.targetState.lastSync = new Date().getTime() / 1000
          await broadcast(room)
        })

        socket.on("playItemFromPlaylist", async (index) => {
          let room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Play ended for non existing room:" + roomId)
          }

          if (index < 0 || index >= room.targetState.playlist.items.length) {
            return log(
              "out of index:",
              index,
              "playlist.length:",
              room.targetState.playlist.items.length
            )
          }

          log("playing item", index, "from playlist")
          room.targetState.playing = room.targetState.playlist.items[index]
          room.targetState.playlist.currentIndex = index
          room.targetState.progress = 0
          room.targetState.lastSync = new Date().getTime() / 1000
          await broadcast(room)
        })

        socket.on("updatePlaylist", async (playlist: Playlist) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting playlist for non existing room:" + roomId)
          }
          log("playlist update", playlist)

          if (
            playlist.currentIndex < -1 ||
            playlist.currentIndex >= playlist.items.length
          ) {
            return log(
              "out of index:",
              playlist.currentIndex,
              "playlist.length:",
              playlist.items.length
            )
          }

          room.targetState.playlist = playlist
          await broadcast(room)
        })

        socket.on("updateUser", async (user: UserState) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Setting user for non existing room:" + roomId)
          }
          log("user update", user)

          room.users = room.users.map((u: UserState) => {
            if (u.socketIds[0] !== socket.id) {
              return u
            }
            if (u.avatar !== user.avatar) {
              u.avatar = user.avatar
            }
            if (u.name !== user.name) {
              u.name = user.name
            }
            return u
          })

          await broadcast(room)
        })

        socket.on("playUrl", async (url) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error(
              "Impossible non existing room, cannot send anything:" + roomId
            )
          }
          log("playing url", url)

          if (!isUrl(url)) {
            return
          }

          room.targetState.playing = {
            src: [{ src: url, resolution: "" }],
            sub: [],
          }
          room.targetState.playlist.currentIndex = -1
          room.targetState.progress = 0
          room.targetState.lastSync = new Date().getTime() / 1000
          await broadcast(room)
        })

        socket.on("fetch", async () => {
          try {
            const room = await getRoom(roomId)
            if (room === null) {
              log("Room not found for fetch request")
              return
            }

            room.serverTime = new Date().getTime()
            socket.emit("update", room)
          } catch (error) {
            log("Error handling fetch:", error)
          }
        })

        // Chat event handlers
        socket.on("sendChatMessage", async (messageText: string) => {
          const room = await getRoom(roomId)
          if (room === null) {
            throw new Error("Cannot send message to non-existing room:" + roomId)
          }

          // Find the user who sent the message
          const user = room.users.find((u: UserState) => u.socketIds[0] === socket.id)
          if (!user) {
            log("User not found in room, cannot send message")
            return
          }

          // Create chat message
          const chatMessage: ChatMessage = {
            id: `${Date.now()}-${socket.id}`,
            userId: user.uid,
            userName: user.name,
            message: messageText.trim(),
            timestamp: Date.now(),
            type: 'message'
          }

          // Save to Redis Stream
          await addChatMessage(roomId, chatMessage)

          // Broadcast to all users in the room
          io.to(roomId).emit("chatMessage", chatMessage)

          log("chat message sent:", messageText)
        })

        socket.on("requestChatHistory", async () => {
          const chatHistory = await getChatHistory(roomId, 50)
          socket.emit("chatHistory", chatHistory)
          log("sent chat history, messages:", chatHistory.length)
        })

        socket.on("setTyping", async (isTyping: boolean) => {
          const room = await getRoom(roomId)
          if (room === null) return

          const user = room.users.find((u: UserState) => u.socketIds[0] === socket.id)
          if (!user) return

          if (isTyping) {
            await addTypingUser(roomId, user.uid)
          } else {
            await removeTypingUser(roomId, user.uid)
          }

          // Broadcast typing status to other users
          socket.to(roomId).emit("userTyping", user.uid, user.name, isTyping)
          log("user typing status:", user.name, isTyping)
        })
        } catch (error) {
          console.error("Socket connection error for socket", socket.id, ":", error)
          socket.disconnect()
        }
      }
    )

      // @ts-ignore
      res.socket.server.io = io
    }

    res.end()
  } catch (error) {
    console.error("Socket.IO handler error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default ioHandler
