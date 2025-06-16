const { Server } = require("socket.io");
const { createServer } = require("http");
const { createClient } = require("redis");

const PORT = process.env.PORT || 3001;

// Redis setup (same as your existing cache.ts logic)
let client = null;
let isConnected = false;
const memoryStore = new Map();

const redisUrl = process.env.REDIS_URL;
if (redisUrl && redisUrl !== "redis://localhost:6379") {
  try {
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    client.connect().then(() => {
      isConnected = true;
      console.log("Connected to Redis server successfully");
    }).catch((error) => {
      console.warn("Redis connection failed, using memory-only mode:", error);
      isConnected = false;
      client = null;
    });
  } catch (error) {
    console.warn("Failed to create Redis client, using memory-only mode:", error);
    client = null;
    isConnected = false;
  }
} else {
  console.log("Redis URL not configured, running in memory-only mode");
}

// Create HTTP server
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Movie Hangout Socket.IO Server Running');
});

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://your-netlify-site.netlify.app",
      // Add your actual Netlify domain here
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Import cache and room functions
const cache = require('./cache');
const { createNewRoom, createNewUser, updateLastSync, isUrl } = require('./room');
const { setupSocketHandlers } = require('./socket-handlers');

// Set Redis client in cache module
if (client) {
  cache.setRedisClient(client, isConnected);
}

console.log(`Socket.IO server starting on port ${PORT}`);

// Socket.IO connection handler
io.on("connection", async (socket) => {
  try {
    console.log("New socket connection:", socket.id, "transport:", socket.conn.transport.name);

    if (!socket.handshake.query.roomId || typeof socket.handshake.query.roomId !== "string") {
      console.log("Invalid roomId, disconnecting socket:", socket.id);
      socket.disconnect();
      return;
    }

    const roomId = socket.handshake.query.roomId.toLowerCase();
    const log = (...props) => {
      console.log(`[${new Date().toUTCString()}][room ${roomId}]`, socket.id, ...props);
    };

    // Create room if it doesn't exist
    if (!(await cache.roomExists(roomId))) {
      await createNewRoom(roomId, socket.id);
      log("created room");
    }

    socket.join(roomId);
    await cache.incUsers();
    log("joined");

    await createNewUser(roomId, socket.id);

    // Broadcast function
    const broadcast = async (room) => {
      const roomId = typeof room === "string" ? room : room.id;
      let roomData;

      if (typeof room !== "string") {
        roomData = room;
        await cache.setRoom(roomId, roomData);
      } else {
        const d = await cache.getRoom(roomId);
        if (d === null) {
          throw Error("Impossible room state of null for room: " + roomId);
        }
        roomData = d;
      }

      roomData.serverTime = new Date().getTime();
      io.to(roomId).emit("update", roomData);
    };

    // Send join message to chat
    const room = await cache.getRoom(roomId);
    if (room) {
      const user = room.users.find(u => u.socketIds[0] === socket.id);
      if (user) {
        const joinMessage = {
          id: `join-${Date.now()}-${socket.id}`,
          userId: user.uid,
          userName: user.name,
          message: `${user.name} joined the room`,
          timestamp: Date.now(),
          type: 'join'
        };
        await cache.addChatMessage(roomId, joinMessage);
        io.to(roomId).emit("chatMessage", joinMessage);
      }
    }

    // Setup all socket event handlers
    setupSocketHandlers(socket, io, roomId, log, broadcast);

  } catch (error) {
    console.error("Socket connection error for socket", socket.id, ":", error);
    socket.disconnect();
  }
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
