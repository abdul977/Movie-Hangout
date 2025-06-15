import React, { FC, useState, useRef, useEffect } from "react"

interface Props {
  onSendMessage: (message: string) => void
  onTyping: (isTyping: boolean) => void
}

const ChatInput: FC<Props> = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
      handleStopTyping()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false)
      onTyping(false)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-dark-700 bg-dark-900">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleStopTyping}
          placeholder="Type a message..."
          className="flex-1 px-3 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-800 transition-colors min-h-[44px]"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-4 py-3 bg-primary-900 hover:bg-primary-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium min-h-[44px] min-w-[60px] flex items-center justify-center"
        >
          Send
        </button>
      </div>
    </form>
  )
}

export default ChatInput
