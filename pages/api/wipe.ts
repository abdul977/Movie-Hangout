import { NextApiRequest, NextApiResponse } from "next"
import { wipeCache } from "../../lib/cache"

export default async function wipe(
  _: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" })
  }

  try {
    await wipeCache()
    res.status(200).json({ message: "Cache wiped successfully" })
  } catch (error) {
    console.error("Error wiping cache:", error)
    res.status(500).json({ error: "Failed to wipe cache" })
  }
}
