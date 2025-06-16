# Movie Hangout Socket.IO Server

This is the Socket.IO server for the Movie Hangout application, designed to run on Railway.app or similar platforms.

## Features

- Real-time video synchronization
- Chat functionality
- User management
- Playlist management
- Redis support for persistence

## Environment Variables

Set these in your Railway dashboard:

```
PORT=3001
REDIS_URL=redis://localhost:6379
DEFAULT_SRC=https://youtu.be/NcBjx_eyvxc4
FRONTEND_URL=https://your-netlify-site.netlify.app
```

## Deployment to Railway

1. Create a new project on [railway.app](https://railway.app)
2. Connect your GitHub repository containing this socket-server folder
3. Set the root directory to `socket-server`
4. Add environment variables
5. Deploy!

## Local Development

```bash
npm install
npm start
```

The server will run on port 3001 by default.

## Testing

Once deployed, you can test the server by visiting the URL. You should see "Movie Hangout Socket.IO Server Running".

## CORS Configuration

The server is configured to accept connections from:
- localhost:3000 (development)
- Your Netlify domain (production)

Make sure to update the CORS origins in server.js with your actual domain.
