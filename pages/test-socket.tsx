import { useEffect, useState } from 'react'
import { createClientSocket } from '../lib/socket'
import { Socket } from 'socket.io-client'

export default function TestSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    addLog('Initializing Socket.IO connection...')
    
    // First, call the API endpoint to initialize the server
    fetch('/api/socketio')
      .then(() => {
        addLog('API endpoint called successfully')
        
        const newSocket = createClientSocket('test-room')
        
        newSocket.on('connect', () => {
          addLog(`Connected! Socket ID: ${newSocket.id}`)
          setConnected(true)
        })
        
        newSocket.on('connect_error', (error) => {
          addLog(`Connection error: ${error.message}`)
        })
        
        newSocket.on('disconnect', (reason) => {
          addLog(`Disconnected: ${reason}`)
          setConnected(false)
        })
        
        newSocket.on('update', (data) => {
          addLog(`Received update: ${JSON.stringify(data, null, 2)}`)
        })
        
        setSocket(newSocket)
      })
      .catch((error) => {
        addLog(`API endpoint error: ${error.message}`)
      })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const testFetch = () => {
    if (socket && connected) {
      addLog('Sending fetch request...')
      socket.emit('fetch')
    } else {
      addLog('Socket not connected')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Connection Test</h1>
      
      <div className="mb-4">
        <div className={`inline-block px-3 py-1 rounded ${connected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          Status: {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="mb-4">
        <button 
          onClick={testFetch}
          disabled={!connected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Test Fetch
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Connection Logs:</h2>
        <div className="max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
