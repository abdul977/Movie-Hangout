// Room utility functions (simplified version of your lib/room.ts)
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { getRoom, setRoom } = require('./cache');

function generateRandomName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
  });
}

function createNewRoom(roomId, socketId) {
  const room = {
    id: roomId,
    ownerId: socketId,
    users: [],
    targetState: {
      playing: {
        src: [{ src: process.env.DEFAULT_SRC || "", resolution: "" }],
        sub: []
      },
      paused: true,
      progress: 0,
      playbackRate: 1,
      loop: false,
      lastSync: new Date().getTime() / 1000,
      playlist: {
        currentIndex: -1,
        items: []
      }
    },
    serverTime: new Date().getTime()
  };
  
  return setRoom(roomId, room);
}

function createNewUser(roomId, socketId) {
  return new Promise(async (resolve, reject) => {
    try {
      const room = await getRoom(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const newUser = {
        uid: socketId,
        name: generateRandomName(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socketId}`,
        socketIds: [socketId],
        player: {
          progress: 0,
          paused: true,
          playbackRate: 1
        }
      };

      room.users.push(newUser);
      await setRoom(roomId, room);
      resolve(newUser);
    } catch (error) {
      reject(error);
    }
  });
}

function updateLastSync(room) {
  room.targetState.lastSync = new Date().getTime() / 1000;
  return room;
}

function isUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  createNewRoom,
  createNewUser,
  updateLastSync,
  isUrl
};
