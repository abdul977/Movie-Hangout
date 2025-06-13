const redis = require('redis');

async function checkRedisDatabase() {
  // Connect to your Redis Cloud instance
  const client = redis.createClient({
    url: 'redis://default:kJovVpgJkDeeZVvL5A6vhCznvWQ06kHU@redis-15049.c274.us-east-1-3.ec2.redns.redis-cloud.com:15049'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis Cloud successfully!\n');

    // Get basic info about the database
    console.log('📊 DATABASE OVERVIEW:');
    console.log('==================');
    
    // Check how many keys exist
    const allKeys = await client.keys('*');
    console.log(`Total keys in database: ${allKeys.length}`);
    
    if (allKeys.length === 0) {
      console.log('🔍 Database is empty - no data stored yet');
      console.log('💡 This means no one has used the app yet or all rooms have expired\n');
      return;
    }

    console.log('\n🔑 KEYS FOUND:');
    console.log('=============');
    allKeys.forEach(key => console.log(`- ${key}`));

    // Check for room data
    const roomKeys = allKeys.filter(key => key.startsWith('room:'));
    console.log(`\n🏠 ROOMS: ${roomKeys.length} active rooms`);
    
    if (roomKeys.length > 0) {
      console.log('=============');
      for (const roomKey of roomKeys) {
        const roomData = await client.get(roomKey);
        if (roomData) {
          const room = JSON.parse(roomData);
          const roomId = roomKey.replace('room:', '');
          console.log(`\n📺 Room: ${roomId}`);
          console.log(`   👥 Users: ${room.users.length}`);
          console.log(`   🎬 Currently playing: ${room.targetState.playing.src[0]?.src || 'Nothing'}`);
          console.log(`   ⏸️  Paused: ${room.targetState.paused ? 'Yes' : 'No'}`);
          console.log(`   ⏱️  Progress: ${Math.floor(room.targetState.progress)} seconds`);
          console.log(`   🔄 Playback rate: ${room.targetState.playbackRate}x`);
          
          if (room.users.length > 0) {
            console.log(`   👤 Users in room:`);
            room.users.forEach(user => {
              console.log(`      - ${user.name} (${user.uid})`);
            });
          }
        }
      }
    }

    // Check for room list
    const roomsSet = await client.sMembers('rooms');
    console.log(`\n📋 ROOMS SET: ${roomsSet.length} rooms tracked`);
    if (roomsSet.length > 0) {
      console.log('Room IDs:', roomsSet.join(', '));
    }

    // Check user count
    const userCount = await client.get('userCount');
    console.log(`\n👥 TOTAL USERS ONLINE: ${userCount || 0}`);

    // Check for any other data
    const otherKeys = allKeys.filter(key => 
      !key.startsWith('room:') && 
      key !== 'rooms' && 
      key !== 'userCount'
    );
    
    if (otherKeys.length > 0) {
      console.log(`\n🔧 OTHER DATA: ${otherKeys.length} other keys`);
      for (const key of otherKeys) {
        const value = await client.get(key);
        console.log(`   ${key}: ${value}`);
      }
    }

  } catch (error) {
    console.error('❌ Error connecting to Redis:', error.message);
  } finally {
    await client.quit();
    console.log('\n🔌 Disconnected from Redis');
  }
}

// Run the check
checkRedisDatabase();
