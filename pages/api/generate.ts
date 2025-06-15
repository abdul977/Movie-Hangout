import { listRooms } from "../../lib/cache"
import { generateId } from "../../lib/utils"
import { NextApiRequest, NextApiResponse } from "next"

export default async function generate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow GET requests (as used by frontend)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Generate API called - creating new room ID')

    const rooms = await listRooms()
    let length = 4
    if (rooms.length > 2000) {
      length = 5
    } else if (rooms.length > 20000) {
      length = 6
    }

    let newRoomId = generateId(length)
    let attempts = 0
    const maxAttempts = 10

    // Prevent infinite loops
    while (rooms.includes(newRoomId) && attempts < maxAttempts) {
      newRoomId = generateId(length)
      attempts++
    }

    if (attempts >= maxAttempts) {
      console.warn('Max attempts reached generating unique room ID, using longer ID')
      newRoomId = generateId(length + 1)
    }

    console.log(`Generated new room ID: ${newRoomId}`)
    res.status(200).json({ roomId: newRoomId })
  } catch (error) {
    console.error("Error generating room ID:", error)
    // Fallback to generating a simple ID even if cache fails
    const fallbackId = generateId(6)
    console.log(`Using fallback room ID: ${fallbackId}`)
    res.status(200).json({ roomId: fallbackId })
  }
}
