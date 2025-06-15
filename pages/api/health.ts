import { NextApiRequest, NextApiResponse } from "next"
import { getRedisURL } from "../../lib/env"

export default async function health(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const redisUrl = getRedisURL()
    const isRedisConfigured = redisUrl && redisUrl !== "redis://localhost:6379"
    
    // Test basic functionality
    const testData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      redisConfigured: isRedisConfigured,
      redisUrl: redisUrl ? redisUrl.replace(/\/\/.*@/, '//***@') : 'not configured', // Hide credentials
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown'
    }

    console.log('Health check performed:', testData)
    
    res.status(200).json({
      status: 'ok',
      ...testData
    })
  } catch (error) {
    console.error("Health check failed:", error)
    res.status(500).json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
