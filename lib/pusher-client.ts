// Alternative real-time solution using Pusher
// Install: npm install pusher pusher-js

import Pusher from 'pusher-js';

export function createPusherClient(roomId: string) {
  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  const channel = pusher.subscribe(`room-${roomId}`);
  
  return {
    pusher,
    channel,
    emit: (event: string, data: any) => {
      // Send to your Netlify function which triggers Pusher
      fetch('/api/pusher-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, roomId })
      });
    },
    on: (event: string, callback: (data: any) => void) => {
      channel.bind(event, callback);
    },
    disconnect: () => {
      pusher.unsubscribe(`room-${roomId}`);
      pusher.disconnect();
    }
  };
}
