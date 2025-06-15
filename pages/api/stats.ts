import { countRooms, countUsers } from "../../lib/cache"
import { NextApiRequest, NextApiResponse } from "next"

export default async function stats(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Stats API called - fetching room and user counts')

    const rooms = await countRooms()
    const users = await countUsers()

    console.log(`Stats fetched successfully: ${rooms} rooms, ${users} users`)
    res.status(200).json({ rooms, users })
  } catch (error) {
    console.error("Error fetching stats:", error)
    // Return default values instead of error to prevent UI breaking
    res.status(200).json({ rooms: 0, users: 0 })
  }
}
