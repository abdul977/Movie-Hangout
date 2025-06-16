// Fallback API for socket actions when WebSocket is not available
import { getRoom, setRoom } from "../../lib/cache.js"

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { roomId, event, data } = await req.json()
    
    console.log(`Fallback action: ${event} for room ${roomId}`)
    
    const room = await getRoom(roomId)
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle different socket events
    switch (event) {
      case 'setPaused':
        room.targetState.paused = data
        room.targetState.lastSync = new Date().getTime() / 1000
        break
        
      case 'seek':
        room.targetState.progress = data
        room.targetState.lastSync = new Date().getTime() / 1000
        break
        
      case 'playUrl':
        room.targetState.playing = {
          src: [{ src: data, resolution: "" }],
          sub: [],
        }
        room.targetState.playlist.currentIndex = -1
        room.targetState.progress = 0
        room.targetState.lastSync = new Date().getTime() / 1000
        break
        
      default:
        console.log(`Unhandled fallback event: ${event}`)
    }

    // Save updated room state
    await setRoom(roomId, room)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error("Room action error:", error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
