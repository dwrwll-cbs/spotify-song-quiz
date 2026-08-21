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
        snippetDuration: 10,   // how many seconds of audio to play (1-30)
        answerTime: 30,        // how many seconds players have to answer (30+)
        startPosition: 'beginning', // 'beginning' | 'random'
        audioHostOnly: false
      },
      playlist: null,
      tracks: [],
      currentTrackIndex: 0,
      playedTrackIndices: [],
      currentTrack: null,
      timerSeconds: 0,
      timerInterval: null,
      players: new Map([
        [hostId, this._createPlayer(hostId, hostName, avatar, true)]
      ])
    };

    this.rooms.set(roomId, room);
    return room;
  }

  _createPlayer(id, name, avatar, isHost) {
    return {
      id,
      socketId: null,
      name,
      avatar: avatar || (isHost ? '🎵' : '🎸'),
      score: 0,
      isHost,
      guessedTitle: false,
      guessedArtist: false,
      titlePoints: 0,
      artistPoints: 0,
      lastPoints: 0
    };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, playerId, playerName, avatar, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!room.players.has(playerId)) {
      room.players.set(playerId, this._createPlayer(playerId, playerName, avatar, false));
      const player = room.players.get(playerId);
      player.socketId = socketId;
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

  resetPlayerRound(room) {
    room.players.forEach(p => {
      p.guessedTitle = false;
      p.guessedArtist = false;
      p.titlePoints = 0;
      p.artistPoints = 0;
      p.lastPoints = 0;
    });
  }

  resetPlayerScores(room) {
    room.players.forEach(p => {
      p.score = 0;
      p.guessedTitle = false;
      p.guessedArtist = false;
      p.titlePoints = 0;
      p.artistPoints = 0;
      p.lastPoints = 0;
    });
  }

  serializeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const isHidden = room.status === 'PLAYING';

    // Mask sensitive info during PLAYING phase
    const safeTrack = room.currentTrack ? {
      id: room.currentTrack.id,
      previewUrl: room.currentTrack.previewUrl,
      startOffset: room.currentTrack.startOffset || 0,
      title: isHidden ? '???' : room.currentTrack.title,
      artist: isHidden ? '???' : room.currentTrack.artist,
      albumCover: isHidden ? null : room.currentTrack.albumCover
    } : null;

    return {
      id: room.id,
      hostId: room.hostId,
      status: room.status,
      config: room.config,
      playlist: room.playlist ? {
        id: room.playlist.id,
        name: room.playlist.name,
        image: room.playlist.image,
        totalFound: room.playlist.totalFound
      } : null,
      currentTrackIndex: room.currentTrackIndex,
      totalSongs: Math.min(room.config.numSongs, room.tracks?.length || 0),
      currentTrack: safeTrack,
      timerSeconds: room.timerSeconds,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        guessedTitle: p.guessedTitle,
        guessedArtist: p.guessedArtist,
        titlePoints: p.titlePoints,
        artistPoints: p.artistPoints,
        lastPoints: p.lastPoints
      }))
    };
  }

  /**
   * Evaluate a guess against the current track.
   * Returns { titleMatch: boolean, artistMatch: boolean }
   */
  evaluateGuess(guess, track) {
    if (!guess || !track) return { titleMatch: false, artistMatch: false };

    const normalize = (str) =>
      str.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '');

    const cleanGuess = normalize(guess);
    const cleanTitle = normalize(track.title);
    const cleanArtist = normalize(track.artist);

    // Also check individual artists (for "Artist1, Artist2" format)
    const artistParts = track.artist.split(/[,&]/).map(a => normalize(a.trim()));

    let titleMatch = false;
    let artistMatch = false;

    // Title matching
    if (cleanGuess.length >= 3) {
      if (cleanTitle.includes(cleanGuess) || cleanGuess.includes(cleanTitle)) {
        titleMatch = true;
      } else {
        const titleSim = stringSimilarity.compareTwoStrings(cleanGuess, cleanTitle);
        if (titleSim > 0.6) titleMatch = true;
      }
    }

    // Artist matching
    if (cleanGuess.length >= 3) {
      // Check full artist string
      if (cleanArtist.includes(cleanGuess) || cleanGuess.includes(cleanArtist)) {
        artistMatch = true;
      } else {
        const artistSim = stringSimilarity.compareTwoStrings(cleanGuess, cleanArtist);
        if (artistSim > 0.7) artistMatch = true;
      }

      // Check individual artist parts
      if (!artistMatch) {
        for (const part of artistParts) {
          if (part.length >= 2 && (part.includes(cleanGuess) || cleanGuess.includes(part))) {
            artistMatch = true;
            break;
          }
          const partSim = stringSimilarity.compareTwoStrings(cleanGuess, part);
          if (partSim > 0.7) {
            artistMatch = true;
            break;
          }
        }
      }
    }

    return { titleMatch, artistMatch };
  }
}

export const roomManager = new RoomManager();
