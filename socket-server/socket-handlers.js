// Socket event handlers
const cache = require('./cache');
const { updateLastSync, isUrl } = require('./room');

function setupSocketHandlers(socket, io, roomId, log, broadcast) {
  
  // Disconnect handler
  socket.on("disconnect", async () => {
    await cache.decUsers();
    log("disconnected");
    const room = await cache.getRoom(roomId);
    if (room === null) return;

    // Find the user who's leaving
    const leavingUser = room.users.find(user => user.socketIds[0] === socket.id);

    room.users = room.users.filter(user => user.socketIds[0] !== socket.id);

    // Send leave message to chat if user was found
    if (leavingUser) {
      const leaveMessage = {
        id: `leave-${Date.now()}-${socket.id}`,
        userId: leavingUser.uid,
        userName: leavingUser.name,
        message: `${leavingUser.name} left the room`,
        timestamp: Date.now(),
        type: 'leave'
      };
      await cache.addChatMessage(roomId, leaveMessage);
      await cache.removeTypingUser(roomId, leavingUser.uid);
    }

    if (room.users.length === 0) {
      await cache.deleteRoom(roomId);
      await cache.clearChatHistory(roomId);
      log("deleted empty room and chat history");
    } else {
      if (room.ownerId === socket.id) {
        room.ownerId = room.users[0].uid;
      }

      // Broadcast leave message to remaining users
      if (leavingUser) {
        const leaveMessage = {
          id: `leave-${Date.now()}-${socket.id}`,
          userId: leavingUser.uid,
          userName: leavingUser.name,
          message: `${leavingUser.name} left the room`,
          timestamp: Date.now(),
          type: 'leave'
        };
        io.to(roomId).emit("chatMessage", leaveMessage);
      }

      await broadcast(room);
    }
  });

  // Media control handlers
  socket.on("setPaused", async (paused) => {
    let room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting pause for non existing room:" + roomId);
    }
    log("set paused to", paused);

    room = updateLastSync(room);
    room.targetState.paused = paused;
    await broadcast(room);
  });

  socket.on("setLoop", async (loop) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting loop for non existing room:" + roomId);
    }
    log("set loop to", loop);

    room.targetState.loop = loop;
    await broadcast(updateLastSync(room));
  });

  socket.on("setProgress", async (progress) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting progress for non existing room:" + roomId);
    }

    room.users = room.users.map(user => {
      if (user.socketIds[0] === socket.id) {
        user.player.progress = progress;
      }
      return user;
    });

    await broadcast(room);
  });

  socket.on("setPlaybackRate", async (playbackRate) => {
    let room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting playbackRate for non existing room:" + roomId);
    }
    log("set playbackRate to", playbackRate);

    room = updateLastSync(room);
    room.targetState.playbackRate = playbackRate;
    await broadcast(room);
  });

  socket.on("seek", async (progress) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting progress for non existing room:" + roomId);
    }
    log("seeking to", progress);

    room.targetState.progress = progress;
    room.targetState.lastSync = new Date().getTime() / 1000;
    await broadcast(room);
  });

  socket.on("playEnded", async () => {
    let room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Play ended for non existing room:" + roomId);
    }
    log("playback ended");

    if (room.targetState.loop) {
      room.targetState.progress = 0;
      room.targetState.paused = false;
    } else if (
      room.targetState.playlist.currentIndex + 1 <
      room.targetState.playlist.items.length
    ) {
      room.targetState.playing =
        room.targetState.playlist.items[
          room.targetState.playlist.currentIndex + 1
        ];
      room.targetState.playlist.currentIndex += 1;
      room.targetState.progress = 0;
      room.targetState.paused = false;
    } else {
      room.targetState.progress =
        room.users.find(user => user.socketIds[0] === socket.id)?.player
          .progress || 0;
      room.targetState.paused = true;
    }
    room.targetState.lastSync = new Date().getTime() / 1000;
    await broadcast(room);
  });

  socket.on("playAgain", async () => {
    let room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Play again for non existing room:" + roomId);
    }
    log("play same media again");

    room.targetState.progress = 0;
    room.targetState.paused = false;
    room.targetState.lastSync = new Date().getTime() / 1000;
    await broadcast(room);
  });

  socket.on("playItemFromPlaylist", async (index) => {
    let room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Play ended for non existing room:" + roomId);
    }

    if (index < 0 || index >= room.targetState.playlist.items.length) {
      return log(
        "out of index:",
        index,
        "playlist.length:",
        room.targetState.playlist.items.length
      );
    }

    log("playing item", index, "from playlist");
    room.targetState.playing = room.targetState.playlist.items[index];
    room.targetState.playlist.currentIndex = index;
    room.targetState.progress = 0;
    room.targetState.lastSync = new Date().getTime() / 1000;
    await broadcast(room);
  });

  socket.on("updatePlaylist", async (playlist) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting playlist for non existing room:" + roomId);
    }
    log("playlist update", playlist);

    if (
      playlist.currentIndex < -1 ||
      playlist.currentIndex >= playlist.items.length
    ) {
      return log(
        "out of index:",
        playlist.currentIndex,
        "playlist.length:",
        playlist.items.length
      );
    }

    room.targetState.playlist = playlist;
    await broadcast(room);
  });

  socket.on("updateUser", async (user) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Setting user for non existing room:" + roomId);
    }
    log("user update", user);

    room.users = room.users.map(u => {
      if (u.socketIds[0] !== socket.id) {
        return u;
      }
      if (u.avatar !== user.avatar) {
        u.avatar = user.avatar;
      }
      if (u.name !== user.name) {
        u.name = user.name;
      }
      return u;
    });

    await broadcast(room);
  });

  socket.on("playUrl", async (url) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Impossible non existing room, cannot send anything:" + roomId);
    }
    log("playing url", url);

    if (!isUrl(url)) {
      return;
    }

    room.targetState.playing = {
      src: [{ src: url, resolution: "" }],
      sub: [],
    };
    room.targetState.playlist.currentIndex = -1;
    room.targetState.progress = 0;
    room.targetState.lastSync = new Date().getTime() / 1000;
    await broadcast(room);
  });

  socket.on("fetch", async () => {
    try {
      const room = await cache.getRoom(roomId);
      if (room === null) {
        log("Room not found for fetch request");
        return;
      }

      room.serverTime = new Date().getTime();
      socket.emit("update", room);
    } catch (error) {
      log("Error handling fetch:", error);
    }
  });

  // Chat event handlers
  socket.on("sendChatMessage", async (messageText) => {
    const room = await cache.getRoom(roomId);
    if (room === null) {
      throw new Error("Cannot send message to non-existing room:" + roomId);
    }

    const user = room.users.find(u => u.socketIds[0] === socket.id);
    if (!user) {
      log("User not found in room, cannot send message");
      return;
    }

    const chatMessage = {
      id: `${Date.now()}-${socket.id}`,
      userId: user.uid,
      userName: user.name,
      message: messageText.trim(),
      timestamp: Date.now(),
      type: 'message'
    };

    await cache.addChatMessage(roomId, chatMessage);
    io.to(roomId).emit("chatMessage", chatMessage);
    log("chat message sent:", messageText);
  });

  socket.on("requestChatHistory", async () => {
    const chatHistory = await cache.getChatHistory(roomId, 50);
    socket.emit("chatHistory", chatHistory);
    log("sent chat history, messages:", chatHistory.length);
  });

  socket.on("setTyping", async (isTyping) => {
    const room = await cache.getRoom(roomId);
    if (room === null) return;

    const user = room.users.find(u => u.socketIds[0] === socket.id);
    if (!user) return;

    if (isTyping) {
      await cache.addTypingUser(roomId, user.uid);
    } else {
      await cache.removeTypingUser(roomId, user.uid);
    }

    socket.to(roomId).emit("userTyping", user.uid, user.name, isTyping);
    log("user typing status:", user.name, isTyping);
  });
}

module.exports = { setupSocketHandlers };
