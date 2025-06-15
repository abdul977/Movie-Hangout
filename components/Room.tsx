"use client"
import { FC, useEffect, useState } from "react"
import Player from "./player/Player"
import {
  ClientToServerEvents,
  createClientSocket,
  ServerToClientEvents,
} from "../lib/socket"
import Button from "./action/Button"
import { Socket } from "socket.io-client"
import ConnectingAlert from "./alert/ConnectingAlert"
import PlaylistMenu from "./playlist/PlaylistMenu"
import IconLoop from "./icon/IconLoop"
import InputUrl from "./input/InputUrl"
import UserList from "./user/UserList"
import Chat from "./chat/Chat"

interface Props {
  id: string
}

let connecting = false

const Room: FC<Props> = ({ id }) => {
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null)
  const [url, setUrl] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")

  useEffect(() => {
    fetch("/api/socketio").finally(() => {
      if (socket !== null) {
        setConnected(socket.connected)
      } else {
        const newSocket = createClientSocket(id)
        newSocket.on("connect", () => {
          setConnected(true)
          setCurrentUserId(newSocket.id || "")
        })
        setSocket(newSocket)
      }
    })

    return () => {
      if (socket !== null) {
        socket.disconnect()
      }
    }
  }, [id, socket])

  const connectionCheck = () => {
    if (socket !== null && socket.connected) {
      connecting = false
      setConnected(true)
      return
    }
    setTimeout(connectionCheck, 100)
  }

  if (!connected || socket === null) {
    if (!connecting) {
      connecting = true
      connectionCheck()
    }
    return (
      <div className={"flex justify-center"}>
        <ConnectingAlert />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 h-full">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <Player roomId={id} socket={socket} />

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-2 p-2 sm:p-4 bg-dark-900 rounded-lg mt-2">
          <Button
            tooltip="Do a forced manual sync"
            className="flex-shrink-0 p-3 flex flex-row gap-2 items-center justify-center sm:justify-start min-h-[48px]"
            onClick={() => {
              console.log("Fetching update", socket?.id)
              socket?.emit("fetch")
            }}
          >
            <IconLoop className="hover:animate-spin" />
            <span className="hide-below-sm">Manual sync</span>
          </Button>
          <InputUrl
            className="flex-1"
            url={url}
            placeholder="Enter video URL to play"
            tooltip="Play given url now"
            onChange={setUrl}
            onSubmit={() => {
              console.log("Requesting", url, "now")
              socket?.emit("playUrl", url)
              setUrl("")
            }}
          >
            Play
          </InputUrl>
        </div>

        {/* User List - Mobile optimized */}
        <div className="mt-2">
          <UserList socket={socket} />
        </div>
      </div>

      {/* Sidebar for Playlist and Chat */}
      <div className="flex flex-col lg:w-80 gap-2">
        <PlaylistMenu socket={socket} />

        {/* Chat Component - Mobile positioned */}
        {currentUserId && (
          <div className="lg:flex-1">
            <Chat
              socket={socket}
              roomId={id}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Room
