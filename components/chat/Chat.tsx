"use client"
import React, { FC, useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"
import { ClientToServerEvents, ServerToClientEvents } from "../../lib/socket"
import { ChatMessage } from "../../lib/types"
import ChatMessageItem from "./ChatMessageItem"
import ChatInput from "./ChatInput"

interface Props {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
  roomId: string
  currentUserId: string
}

const Chat: FC<Props> = ({ socket, roomId, currentUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // Request chat history when component mounts
    socket.emit("requestChatHistory")

    // Listen for chat events
    socket.on("chatMessage", (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      
      // Increment unread count if chat is not visible
      if (!isVisible && message.userId !== currentUserId) {
        setUnreadCount(prev => prev + 1)
      }
    })

    socket.on("chatHistory", (history: ChatMessage[]) => {
      setMessages(history)
    })

    socket.on("userTyping", (userId: string, userName: string, isTyping: boolean) => {
      if (userId === currentUserId) return // Don't show own typing
      
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userName) ? prev : [...prev, userName]
        } else {
          return prev.filter(name => name !== userName)
        }
      })
    })

    return () => {
      socket.off("chatMessage")
      socket.off("chatHistory")
      socket.off("userTyping")
    }
  }, [socket, currentUserId, isVisible])

  useEffect(() => {
    if (isVisible) {
      setUnreadCount(0)
      scrollToBottom()
    }
  }, [isVisible, messages])

  const sendMessage = (messageText: string) => {
    if (messageText.trim()) {
      socket.emit("sendChatMessage", messageText)
    }
  }

  const setTyping = (isTyping: boolean) => {
    socket.emit("setTyping", isTyping)
  }

  const toggleChat = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className="lg:relative lg:h-full">
      {/* Mobile: Fixed positioning, Desktop: Relative */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        {/* Mobile Chat Toggle Button */}
        <button
          onClick={toggleChat}
          className={`mb-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 min-h-[48px] shadow-lg ${
            isVisible
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-primary-900 hover:bg-primary-800 text-white"
          }`}
        >
          💬 {isVisible ? "Close Chat" : "Chat"}
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Mobile Chat Window */}
        {isVisible && (
          <div
            ref={chatContainerRef}
            className="w-80 max-w-[calc(100vw-2rem)] h-96 max-h-[60vh] bg-dark-900 border border-dark-700 rounded-lg shadow-2xl flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-3 border-b border-dark-700 bg-dark-800 rounded-t-lg flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">Room Chat</h3>
                <p className="text-gray-400 text-sm">{roomId}</p>
              </div>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isOwnMessage={message.userId === currentUserId}
                />
              ))}

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="text-gray-400 text-sm italic">
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput onSendMessage={sendMessage} onTyping={setTyping} />
          </div>
        )}
      </div>

      {/* Desktop Chat - Always visible in sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:h-full">
        <div className="bg-dark-900 border border-dark-700 rounded-lg shadow-lg flex flex-col h-full min-h-[400px]">
          {/* Chat Header */}
          <div className="p-3 border-b border-dark-700 bg-dark-800 rounded-t-lg">
            <h3 className="text-white font-medium">Room Chat</h3>
            <p className="text-gray-400 text-sm">{roomId}</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.userId === currentUserId}
              />
            ))}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="text-gray-400 text-sm italic">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <ChatInput onSendMessage={sendMessage} onTyping={setTyping} />
        </div>
      </div>
    </div>
  )
}

export default Chat
