// Cache functions for the socket server (simplified version of your lib/cache.ts)

let client = null;
let isConnected = false;
const memoryStore = new Map();

// Initialize Redis client (will be set from server.js)
function setRedisClient(redisClient, connected) {
  client = redisClient;
  isConnected = connected;
}

// Helper functions
async function get(key) {
  if (isConnected && client) {
    try {
      return await client.get(key);
    } catch (error) {
      console.error("Redis get error:", error);
      return memoryStore.get(key) || null;
    }
  }
  return memoryStore.get(key) || null;
}

async function set(key, value, ttl = null) {
  if (isConnected && client) {
    try {
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      console.error("Redis set error:", error);
      memoryStore.set(key, value);
    }
  } else {
    memoryStore.set(key, value);
  }
}

async function del(key) {
  if (isConnected && client) {
    try {
      await client.del(key);
    } catch (error) {
      console.error("Redis del error:", error);
    }
  }
  memoryStore.delete(key);
}

// Room functions
async function getRoom(roomId) {
  const data = await get(`room:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function setRoom(roomId, room) {
  await set(`room:${roomId}`, JSON.stringify(room));
}

async function deleteRoom(roomId) {
  await del(`room:${roomId}`);
}

async function roomExists(roomId) {
  const room = await getRoom(roomId);
  return room !== null;
}

// User counting
async function incUsers() {
  if (isConnected && client) {
    try {
      await client.incr("users");
    } catch (error) {
      console.error("Redis incr error:", error);
    }
  }
}

async function decUsers() {
  if (isConnected && client) {
    try {
      await client.decr("users");
    } catch (error) {
      console.error("Redis decr error:", error);
    }
  }
}

// Chat functions (simplified)
async function addChatMessage(roomId, message) {
  const key = `chat:${roomId}`;
  if (isConnected && client) {
    try {
      await client.xAdd(key, '*', message);
      await client.expire(key, 86400); // 24 hours
    } catch (error) {
      console.error("Redis chat add error:", error);
    }
  }
}

async function getChatHistory(roomId, count = 50) {
  const key = `chat:${roomId}`;
  if (isConnected && client) {
    try {
      const messages = await client.xRevRange(key, '+', '-', { COUNT: count });
      return messages.map(msg => msg.message).reverse();
    } catch (error) {
      console.error("Redis chat get error:", error);
      return [];
    }
  }
  return [];
}

async function clearChatHistory(roomId) {
  await del(`chat:${roomId}`);
}

// Typing functions (simplified)
async function addTypingUser(roomId, userId) {
  const key = `typing:${roomId}`;
  await set(`${key}:${userId}`, "1", 10); // 10 second TTL
}

async function removeTypingUser(roomId, userId) {
  await del(`typing:${roomId}:${userId}`);
}

module.exports = {
  setRedisClient,
  getRoom,
  setRoom,
  deleteRoom,
  roomExists,
  incUsers,
  decUsers,
  addChatMessage,
  getChatHistory,
  clearChatHistory,
  addTypingUser,
  removeTypingUser
};
