import { countRooms, countUsers } from "../../lib/cache.js"

export default async (req, context) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    console.log('Stats API called - fetching room and user counts')

    const rooms = await countRooms()
    const users = await countUsers()

    console.log(`Stats fetched successfully: ${rooms} rooms, ${users} users`)
    
    return new Response(JSON.stringify({ rooms, users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    // Return default values instead of error to prevent UI breaking
    return new Response(JSON.stringify({ rooms: 0, users: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
