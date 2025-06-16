// API to get current room state for fallback polling
import { getRoom } from "../../lib/cache.js"

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const url = new URL(req.url)
    const roomId = url.searchParams.get('roomId')
    
    if (!roomId) {
      return new Response(JSON.stringify({ error: 'roomId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const room = await getRoom(roomId)
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add server time for sync
    room.serverTime = new Date().getTime()
    
    return new Response(JSON.stringify(room), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error("Room state error:", error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
