import { createClient } from "redis"
import { getRedisURL } from "./env"
import { RoomState, ChatMessage } from "./types"

const redisUrl = getRedisURL()
let client: any = null
let isConnected = false

// Only create Redis client if URL is properly configured
if (redisUrl && redisUrl !== "redis://localhost:6379") {
  try {
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
      maxRetriesPerRequest: 3,
    })

    // Initialize connection
    ;(async () => {
      try {
        await client.connect()
        isConnected = true
        console.log("Connected to Redis server successfully")
      } catch (error) {
        console.warn("Redis connection failed, running in memory-only mode:", error)
        isConnected = false
        client = null
      }
    })()
  } catch (error) {
    console.warn("Failed to create Redis client, using memory-only mode:", error)
    client = null
    isConnected = false
  }
} else {
  console.log("Redis URL not configured or using localhost, running in memory-only mode")
}

// Set up event handlers only if client exists
if (client) {
  client.on("reconnecting", () => {
    console.log("Trying to reconnect to redis server ...")
  })

  client.on("error", (error) => {
    console.error("Failed to contact redis server due to:", error)
    isConnected = false
  })

  client.on("connect", () => {
    isConnected = true
    console.log("Redis connected successfully")
  })

  client.on("end", () => {
    isConnected = false
    console.log("Redis connection ended")
  })
}

// In-memory fallback storage for development
const memoryStore = new Map<string, string>()

export const getRoom = async (roomId: string) => {
  try {
    if (isConnected && client) {
      const data = await client.get("room:" + roomId)
      if (data === null) {
        return data
      }
      return JSON.parse(data) as RoomState
    } else {
      // Fallback to memory store
      const data = memoryStore.get("room:" + roomId)
      if (data === undefined) {
        return null
      }
      return JSON.parse(data) as RoomState
    }
  } catch (error) {
    console.warn("Error getting room from cache, falling back to memory:", error)
    // Fallback to memory store on Redis error
    try {
      const data = memoryStore.get("room:" + roomId)
      if (data === undefined) {
        return null
      }
      return JSON.parse(data) as RoomState
    } catch (memError) {
      console.error("Memory fallback also failed:", memError)
      return null
    }
  }
}

export const roomExists = async (roomId: string) => {
  try {
    if (isConnected && client) {
      return await client.exists("room:" + roomId)
    } else {
      // Fallback to memory store
      return memoryStore.has("room:" + roomId) ? 1 : 0
    }
  } catch (error) {
    console.warn("Error checking room existence, falling back to memory:", error)
    // Fallback to memory store on Redis error
    try {
      return memoryStore.has("room:" + roomId) ? 1 : 0
    } catch (memError) {
      console.error("Memory fallback also failed:", memError)
      return 0
    }
  }
}

export const setRoom = async (roomId: string, data: RoomState) => {
  try {
    if (isConnected) {
      if (!(await client.sIsMember("rooms", roomId))) {
        await client.sAdd("rooms", roomId)
      }
      return await client.set("room:" + roomId, JSON.stringify(data))
    } else {
      // Fallback to memory store
      const roomKey = "room:" + roomId
      memoryStore.set(roomKey, JSON.stringify(data))

      // Track rooms in memory
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      const rooms = existingRooms ? JSON.parse(existingRooms) : []
      if (!rooms.includes(roomId)) {
        rooms.push(roomId)
        memoryStore.set(roomsKey, JSON.stringify(rooms))
      }
      return "OK"
    }
  } catch (error) {
    console.warn("Error setting room in cache:", error)
    return null
  }
}

export const deleteRoom = async (roomId: string) => {
  try {
    if (isConnected) {
      await client.sRem("rooms", roomId)
      return await client.del("room:" + roomId)
    } else {
      // Fallback to memory store
      const roomKey = "room:" + roomId
      memoryStore.delete(roomKey)

      // Remove from rooms list
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      if (existingRooms) {
        const rooms = JSON.parse(existingRooms).filter((id: string) => id !== roomId)
        memoryStore.set(roomsKey, JSON.stringify(rooms))
      }
      return 1
    }
  } catch (error) {
    console.warn("Error deleting room from cache:", error)
    return 0
  }
}

export const listRooms = async () => {
  try {
    if (isConnected && client) {
      return await client.sMembers("rooms")
    } else {
      // Fallback to memory store
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      return existingRooms ? JSON.parse(existingRooms) : []
    }
  } catch (error) {
    console.warn("Error listing rooms from cache, falling back to memory:", error)
    // Fallback to memory store on Redis error
    try {
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      return existingRooms ? JSON.parse(existingRooms) : []
    } catch (memError) {
      console.error("Memory fallback also failed:", memError)
      return []
    }
  }
}

export const countRooms = async () => {
  try {
    if (isConnected && client) {
      return await client.sCard("rooms")
    } else {
      // Fallback to memory store
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      return existingRooms ? JSON.parse(existingRooms).length : 0
    }
  } catch (error) {
    console.warn("Error counting rooms from cache, falling back to memory:", error)
    // Fallback to memory store on Redis error
    try {
      const roomsKey = "rooms"
      const existingRooms = memoryStore.get(roomsKey)
      return existingRooms ? JSON.parse(existingRooms).length : 0
    } catch (memError) {
      console.error("Memory fallback also failed:", memError)
      return 0
    }
  }
}

export const countUsers = async () => {
  try {
    if (isConnected && client) {
      const count = await client.get("userCount")
      if (count === null) {
        return 0
      }
      return parseInt(count)
    } else {
      // Fallback to memory store
      const count = memoryStore.get("userCount")
      return count ? parseInt(count) : 0
    }
  } catch (error) {
    console.warn("Error counting users from cache, falling back to memory:", error)
    // Fallback to memory store on Redis error
    try {
      const count = memoryStore.get("userCount")
      return count ? parseInt(count) : 0
    } catch (memError) {
      console.error("Memory fallback also failed:", memError)
      return 0
    }
  }
}

export const incUsers = async () => {
  try {
    if (isConnected) {
      return await client.incr("userCount")
    } else {
      // Fallback to memory store
      const currentCount = memoryStore.get("userCount")
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1
      memoryStore.set("userCount", newCount.toString())
      return newCount
    }
  } catch (error) {
    console.warn("Error incrementing user count:", error)
    return 0
  }
}

export const decUsers = async () => {
  try {
    if (isConnected) {
      return await client.decr("userCount")
    } else {
      // Fallback to memory store
      const currentCount = memoryStore.get("userCount")
      const newCount = currentCount ? Math.max(0, parseInt(currentCount) - 1) : 0
      memoryStore.set("userCount", newCount.toString())
      return newCount
    }
  } catch (error) {
    console.warn("Error decrementing user count:", error)
    return 0
  }
}

export const wipeCache = async () => {
  try {
    if (isConnected) {
      return await client.flushAll()
    } else {
      // Fallback to memory store
      memoryStore.clear()
      return "OK"
    }
  } catch (error) {
    console.warn("Error wiping cache:", error)
    return null
  }
}

// Chat-related functions
export const addChatMessage = async (roomId: string, message: ChatMessage) => {
  try {
    if (isConnected) {
      const streamKey = `chat:${roomId}`

      // Add message to Redis Stream
      await client.xAdd(streamKey, '*', {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        message: message.message,
        timestamp: message.timestamp.toString(),
        type: message.type
      })

      // Set expiration for chat history (24 hours)
      await client.expire(streamKey, 24 * 60 * 60)
    } else {
      // Fallback to memory store
      const chatKey = `chat:${roomId}`
      const existingMessages = memoryStore.get(chatKey)
      const messages = existingMessages ? JSON.parse(existingMessages) : []
      messages.push(message)

      // Keep only last 50 messages in memory
      if (messages.length > 50) {
        messages.splice(0, messages.length - 50)
      }

      memoryStore.set(chatKey, JSON.stringify(messages))
    }
  } catch (error) {
    console.warn("Error adding chat message:", error)
  }
}

export const getChatHistory = async (roomId: string, count: number = 50): Promise<ChatMessage[]> => {
  try {
    if (isConnected) {
      const streamKey = `chat:${roomId}`

      // Get last 'count' messages from the stream
      const messages = await client.xRevRange(streamKey, '+', '-', { COUNT: count })

      return messages.reverse().map(msg => ({
        id: msg.message.id as string,
        userId: msg.message.userId as string,
        userName: msg.message.userName as string,
        message: msg.message.message as string,
        timestamp: parseInt(msg.message.timestamp as string),
        type: msg.message.type as 'message' | 'system' | 'join' | 'leave'
      }))
    } else {
      // Fallback to memory store
      const chatKey = `chat:${roomId}`
      const existingMessages = memoryStore.get(chatKey)
      const messages = existingMessages ? JSON.parse(existingMessages) : []

      // Return last 'count' messages
      return messages.slice(-count)
    }
  } catch (error) {
    console.error('Error getting chat history:', error)
    return []
  }
}

export const addTypingUser = async (roomId: string, userId: string) => {
  try {
    if (isConnected) {
      const typingKey = `typing:${roomId}`
      await client.sAdd(typingKey, userId)
      await client.expire(typingKey, 10) // Expire in 10 seconds
    } else {
      // Fallback to memory store
      const typingKey = `typing:${roomId}`
      const existingTyping = memoryStore.get(typingKey)
      const typingUsers = existingTyping ? JSON.parse(existingTyping) : []
      if (!typingUsers.includes(userId)) {
        typingUsers.push(userId)
        memoryStore.set(typingKey, JSON.stringify(typingUsers))
      }

      // Simple expiration simulation - remove after 10 seconds
      setTimeout(() => {
        removeTypingUser(roomId, userId)
      }, 10000)
    }
  } catch (error) {
    console.warn("Error adding typing user:", error)
  }
}

export const removeTypingUser = async (roomId: string, userId: string) => {
  try {
    if (isConnected) {
      const typingKey = `typing:${roomId}`
      await client.sRem(typingKey, userId)
    } else {
      // Fallback to memory store
      const typingKey = `typing:${roomId}`
      const existingTyping = memoryStore.get(typingKey)
      if (existingTyping) {
        const typingUsers = JSON.parse(existingTyping).filter((id: string) => id !== userId)
        memoryStore.set(typingKey, JSON.stringify(typingUsers))
      }
    }
  } catch (error) {
    console.warn("Error removing typing user:", error)
  }
}

export const getTypingUsers = async (roomId: string): Promise<string[]> => {
  try {
    if (isConnected) {
      const typingKey = `typing:${roomId}`
      return await client.sMembers(typingKey)
    } else {
      // Fallback to memory store
      const typingKey = `typing:${roomId}`
      const existingTyping = memoryStore.get(typingKey)
      return existingTyping ? JSON.parse(existingTyping) : []
    }
  } catch (error) {
    console.warn("Error getting typing users:", error)
    return []
  }
}

export const clearChatHistory = async (roomId: string) => {
  try {
    if (isConnected) {
      const streamKey = `chat:${roomId}`
      const typingKey = `typing:${roomId}`

      await client.del(streamKey)
      await client.del(typingKey)
    } else {
      // Fallback to memory store
      const streamKey = `chat:${roomId}`
      const typingKey = `typing:${roomId}`

      memoryStore.delete(streamKey)
      memoryStore.delete(typingKey)
    }
  } catch (error) {
    console.warn("Error clearing chat history:", error)
  }
}
