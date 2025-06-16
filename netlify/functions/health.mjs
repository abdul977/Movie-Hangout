import { getRedisURL } from "../../lib/env.js"

export default async (req, context) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
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
      netlifyRegion: process.env.AWS_REGION || 'unknown',
      netlifyUrl: process.env.URL || 'unknown'
    }

    console.log('Health check performed:', testData)
    
    return new Response(JSON.stringify({
      status: 'ok',
      ...testData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
