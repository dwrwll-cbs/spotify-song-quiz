import stringSimilarity from 'string-similarity';

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, hostId, hostName, avatar) {
    const room = {
      id: roomId,
      hostId: hostId,
      status: 'LOBBY', // LOBBY, PLAYING, REVEALED, GAME_OVER
      config: {
        numSongs: 10,
        sampleDuration: 10, // seconds
        startPosition: 'beginning', // 'beginning' | 'random'
        audioHostOnly: false
      },
      playlist: null,
      tracks: [],
      currentTrackIndex: 0,
      playedTrackIndices: [],
      currentTrack: null,
      currentTrackStartTime: 0,
      timerSeconds: 0,
      timerInterval: null,
      players: new Map([
        [hostId, {
          id: hostId,
          socketId: null,
          name: hostName,
          avatar: avatar || '🎵',
          score: 0,
          isHost: true,
          guessed: false,
          guessTime: null,
          lastPoints: 0
        }]
      ])
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, playerId, playerName, avatar, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!room.players.has(playerId)) {
      room.players.set(playerId, {
        id: playerId,
        socketId: socketId,
        name: playerName,
        avatar: avatar || '🎸',
        score: 0,
        isHost: false,
        guessed: false,
        guessTime: null,
        lastPoints: 0
      });
    } else {
      const player = room.players.get(playerId);
      player.socketId = socketId;
      player.name = playerName;
    }

    return room;
  }

  removePlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.delete(playerId);
    
    // If host leaves and others remain, assign new host
    if (room.hostId === playerId && room.players.size > 0) {
      const firstRemaining = room.players.keys().next().value;
      room.hostId = firstRemaining;
      const newHost = room.players.get(firstRemaining);
      if (newHost) newHost.isHost = true;
    }

    // Delete empty room after delay
    if (room.players.size === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      this.rooms.delete(roomId);
    }
  }

  serializeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Mask sensitive info during PLAYING phase if answer is hidden
    const safeTrack = room.currentTrack ? {
      id: room.currentTrack.id,
      previewUrl: room.currentTrack.previewUrl,
      startOffset: room.currentTrack.startOffset || 0,
      // Only reveal title/artist/cover when state is REVEALED or GAME_OVER
      title: room.status === 'REVEALED' || room.status === 'GAME_OVER' ? room.currentTrack.title : '???',
      artist: room.status === 'REVEALED' || room.status === 'GAME_OVER' ? room.currentTrack.artist : '???',
      albumCover: room.status === 'REVEALED' || room.status === 'GAME_OVER' ? room.currentTrack.albumCover : null
    } : null;

    return {
      id: room.id,
      hostId: room.hostId,
      status: room.status,
      config: room.config,
      playlist: room.playlist ? {
        id: room.playlist.id,
        name: room.playlist.name,
        totalFound: room.playlist.totalFound
      } : null,
      currentTrackIndex: room.currentTrackIndex,
      totalSongs: Math.min(room.config.numSongs, room.tracks?.length || 0),
      currentTrack: safeTrack,
      timerSeconds: room.timerSeconds,
      players: Array.from(room.players.values())
    };
  }

  evaluateGuess(guess, track) {
    if (!guess || !track) return false;
    const cleanGuess = guess.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanTitle = track.title.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanArtist = track.artist.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Direct substring match in title or artist
    if (cleanTitle.includes(cleanGuess) && cleanGuess.length >= 3) return true;
    if (cleanGuess.includes(cleanTitle)) return true;

    // Similarity score check
    const titleSim = stringSimilarity.compareTwoStrings(cleanGuess, cleanTitle);
    const artistSim = stringSimilarity.compareTwoStrings(cleanGuess, cleanArtist);
    
    return titleSim > 0.65 || artistSim > 0.75;
  }
}

export const roomManager = new RoomManager();
