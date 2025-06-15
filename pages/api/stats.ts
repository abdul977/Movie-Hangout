import { countRooms, countUsers } from "../../lib/cache"
import { NextApiRequest, NextApiResponse } from "next"

export default async function stats(_: NextApiRequest, res: NextApiResponse) {
  try {
    const rooms = await countRooms()
    const users = await countUsers()

    res.status(200).json({ rooms, users })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
}
