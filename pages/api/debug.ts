import { getRoom, listRooms } from "../../lib/cache"
import { NextApiRequest, NextApiResponse } from "next"

export default async function debug(_: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" })
  }

  try {
    const rooms = await listRooms()
    const roomData = await Promise.all(
      rooms.map(async (room: string) => await getRoom(room))
    )
    res.status(200).json(roomData)
  } catch (error) {
    console.error("Error fetching debug data:", error)
    res.status(500).json({ error: "Failed to fetch debug data" })
  }
}
