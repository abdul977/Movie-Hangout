import React, { FC } from "react"
import { ChatMessage } from "../../lib/types"

interface Props {
  message: ChatMessage
  isOwnMessage: boolean
}

const ChatMessageItem: FC<Props> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageStyle = () => {
    switch (message.type) {
      case 'system':
        return "text-center text-gray-400 text-sm italic"
      case 'join':
        return "text-center text-green-400 text-sm"
      case 'leave':
        return "text-center text-red-400 text-sm"
      default:
        return isOwnMessage 
          ? "ml-auto bg-blue-600 text-white" 
          : "mr-auto bg-dark-700 text-gray-100"
    }
  }

  if (message.type === 'system' || message.type === 'join' || message.type === 'leave') {
    return (
      <div className={getMessageStyle()}>
        {message.message}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${getMessageStyle()}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-300 mb-1 font-medium">
            {message.userName}
          </div>
        )}
        <div className="break-words">
          {message.message}
        </div>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

export default ChatMessageItem
