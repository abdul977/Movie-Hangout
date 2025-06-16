// Fallback for when Socket.IO is not available
// This provides basic functionality without real-time sync

export function createFallbackSocket(roomId: string) {
  console.log("Using fallback mode for room", roomId)
  
  // Mock socket object that uses HTTP polling instead
  const mockSocket = {
    id: `fallback-${Date.now()}`,
    connected: true,
    
    emit: async (event: string, data?: any) => {
      console.log("Fallback emit:", event, data)
      
      try {
        const response = await fetch(`/api/room-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, event, data })
        })
        
        if (!response.ok) {
          console.error("Fallback emit failed:", response.statusText)
        }
      } catch (error) {
        console.error("Fallback emit error:", error)
      }
    },
    
    on: (event: string, callback: (data: any) => void) => {
      console.log("Fallback on:", event)
      // Store callbacks for polling
      if (!mockSocket._callbacks) mockSocket._callbacks = {}
      if (!mockSocket._callbacks[event]) mockSocket._callbacks[event] = []
      mockSocket._callbacks[event].push(callback)
    },
    
    disconnect: () => {
      console.log("Fallback disconnect")
      mockSocket.connected = false
      if (mockSocket._pollInterval) {
        clearInterval(mockSocket._pollInterval)
      }
    },
    
    _callbacks: {} as any,
    _pollInterval: null as any,
    
    // Start polling for updates
    startPolling: () => {
      mockSocket._pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/room-state?roomId=${roomId}`)
          if (response.ok) {
            const data = await response.json()
            if (mockSocket._callbacks.update) {
              mockSocket._callbacks.update.forEach((cb: any) => cb(data))
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 2000) // Poll every 2 seconds
    }
  }
  
  // Start polling
  setTimeout(() => mockSocket.startPolling(), 1000)
  
  return mockSocket
}
