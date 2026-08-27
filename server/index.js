import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { parsePlaylistId, getPlaylistTracks, getUserPlaylists, getPlaylistTracksWithToken } from './spotifyService.js';
import { roomManager } from './roomManager.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Demo tracks fallback
const DEMO_PLAYLIST = {
  id: 'demo-hits',
  name: 'Global Hits (Demo)',
  image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
  totalFound: 6,
  tracks: [
    {
      id: 'demo-1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      albumCover: 'https://upload.wikimedia.org/wikipedia/pt/c/c1/The_Weeknd_-_Blinding_Lights.png',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo126/v4/bf/16/ef/bf16ef88-ee3a-4467-33c9-d2b4f65ddfb5/mzaf_16450630713702115984.plus.aac.p.m4a'
    },
    {
      id: 'demo-2',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      albumCover: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Shape_of_You_-_Ed_Sheeran.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo125/v4/0d/bb/29/0dbb29fb-b286-9a28-ee38-7bb73dc5ad07/mzaf_1333835697669046313.plus.aac.p.m4a'
    },
    {
      id: 'demo-3',
      title: 'As It Was',
      artist: 'Harry Styles',
      albumCover: 'https://upload.wikimedia.org/wikipedia/en/b/b8/Harry_Styles_-_As_It_Was.png',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo112/v4/bb/94/8f/bb948f98-90ce-cf97-e6c1-a47781b0a516/mzaf_10022204558296716075.plus.aac.p.m4a'
    },
    {
      id: 'demo-4',
      title: 'Levitating',
      artist: 'Dua Lipa',
      albumCover: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Dua_Lipa_-_Levitating.png',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo122/v4/6c/fb/82/6cfb822d-3cb8-11fb-e765-bcf431e21b8c/mzaf_10526019557454271891.plus.aac.p.m4a'
    },
    {
      id: 'demo-5',
      title: 'Flowers',
      artist: 'Miley Cyrus',
      albumCover: 'https://upload.wikimedia.org/wikipedia/en/8/84/Miley_Cyrus_-_Flowers.png',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo116/v4/df/31/61/df3161c5-84ab-660b-8d59-86ab0edae821/mzaf_13111818296495333555.plus.aac.p.m4a'
    },
    {
      id: 'demo-6',
      title: 'Stay',
      artist: 'The Kid LAROI, Justin Bieber',
      albumCover: 'https://upload.wikimedia.org/wikipedia/en/0/0c/The_Kid_Laroi_and_Justin_Bieber_-_Stay.png',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioVideo112/v4/0d/d2/88/0dd28892-d621-c454-e6ed-3f41c3fffa76/mzaf_9706307130248232924.plus.aac.p.m4a'
    }
  ]
};

// API Endpoint to fetch Spotify playlist info
app.post('/api/playlist', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'Insira a URL ou ID da playlist.' });
  }

  const playlistId = parsePlaylistId(url);
  if (!playlistId) {
    return res.status(400).json({ error: 'Link de playlist do Spotify inválido.' });
  }

  try {
    const data = await getPlaylistTracks(playlistId);
    if (!data.tracks || data.tracks.length === 0) {
      return res.status(400).json({ error: 'Nenhuma música com áudio preview foi encontrada nesta playlist.' });
    }
    return res.json(data);
  } catch (err) {
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: err.message });
    } else {
      return res.json(DEMO_PLAYLIST);
    }
  }
});

// ============ User-Authenticated Endpoints ============

// Fetch user's playlists (requires user access token)
app.post('/api/playlist/user', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken || typeof accessToken !== 'string') {
    return res.status(401).json({ error: 'Access token obrigatório.' });
  }

  // Basic token format validation (prevent injection)
  if (accessToken.length > 500 || /[\s<>]/.test(accessToken)) {
    return res.status(400).json({ error: 'Token inválido.' });
  }

  try {
    const data = await getUserPlaylists(accessToken);
    return res.json(data);
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(500).json({ error: 'Erro ao buscar playlists.' });
  }
});

// Fetch tracks from user's playlist (including private)
app.post('/api/playlist/user-tracks', async (req, res) => {
  const { accessToken, playlistId } = req.body;

  if (!accessToken || typeof accessToken !== 'string') {
    return res.status(401).json({ error: 'Access token obrigatório.' });
  }

  if (!playlistId || typeof playlistId !== 'string') {
    return res.status(400).json({ error: 'Playlist ID obrigatório.' });
  }

  // Validate playlistId format (alphanumeric, max 22 chars)
  if (!/^[a-zA-Z0-9]{1,30}$/.test(playlistId)) {
    return res.status(400).json({ error: 'Playlist ID inválido.' });
  }

  // Basic token format validation
  if (accessToken.length > 500 || /[\s<>]/.test(accessToken)) {
    return res.status(400).json({ error: 'Token inválido.' });
  }

  try {
    const data = await getPlaylistTracksWithToken(playlistId, accessToken);
    if (!data.tracks || data.tracks.length === 0) {
      return res.status(400).json({ error: 'Nenhuma música com áudio preview encontrada.' });
    }
    return res.json(data);
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: roomManager.rooms.size });
});

// Socket.IO real-time multiplayer logic
io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUserId = null;

  function broadcastRoomUpdate(roomId) {
    const roomState = roomManager.serializeRoom(roomId);
    if (roomState) {
      io.to(roomId).emit('room-updated', roomState);
    }
  }

  function startRoundTimer(room) {
    if (room.timerInterval) clearInterval(room.timerInterval);

    // Timer runs for answerTime (the time players have to guess), NOT snippetDuration
    room.timerSeconds = room.config.answerTime;
    broadcastRoomUpdate(room.id);

    room.timerInterval = setInterval(() => {
      room.timerSeconds -= 1;

      if (room.timerSeconds <= 0) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
        room.status = 'REVEALED';
        broadcastRoomUpdate(room.id);
      } else {
        io.to(room.id).emit('timer-tick', room.timerSeconds);
      }
    }, 1000);
  }

  socket.on('create-room', ({ hostId, hostName, avatar }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomId);
    currentRoomId = roomId;
    currentUserId = hostId;

    const room = roomManager.createRoom(roomId, hostId, hostName, avatar);
    // Update socket id for host
    const hostPlayer = room.players.get(hostId);
    if (hostPlayer) hostPlayer.socketId = socket.id;

    socket.emit('room-created', roomManager.serializeRoom(roomId));
  });

  socket.on('join-room', ({ roomId, userId, userName, avatar }) => {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = roomManager.getRoom(cleanRoomId);

    if (!room) {
      return socket.emit('error-message', 'Sala não encontrada. Verifique o código.');
    }

    socket.join(cleanRoomId);
    currentRoomId = cleanRoomId;
    currentUserId = userId;

    roomManager.joinRoom(cleanRoomId, userId, userName, avatar, socket.id);
    broadcastRoomUpdate(cleanRoomId);
  });

  socket.on('update-config', ({ roomId, config }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    room.config = { ...room.config, ...config };
    broadcastRoomUpdate(roomId);
  });

  socket.on('set-playlist', ({ roomId, playlist }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    room.playlist = playlist;
    room.tracks = [...playlist.tracks];
    broadcastRoomUpdate(roomId);
  });

  socket.on('start-game', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    if (!room.tracks || room.tracks.length === 0) {
      return socket.emit('error-message', 'Selecione uma playlist com músicas antes de começar.');
    }

    // Reset scores & game state
    room.status = 'PLAYING';
    room.currentTrackIndex = 0;
    room.playedTrackIndices = [];
    roomManager.resetPlayerScores(room);

    // Select first track
    pickNextTrack(room);
    startRoundTimer(room);
  });

  function pickNextTrack(room) {
    const totalAvailable = room.tracks.length;
    const remainingIndices = [];
    for (let i = 0; i < totalAvailable; i++) {
      if (!room.playedTrackIndices.includes(i)) {
        remainingIndices.push(i);
      }
    }

    if (remainingIndices.length === 0 || room.currentTrackIndex >= Math.min(room.config.numSongs, totalAvailable)) {
      room.status = 'GAME_OVER';
      if (room.timerInterval) clearInterval(room.timerInterval);
      broadcastRoomUpdate(room.id);
      return false;
    }

    // Pick random unplayed track
    const randIndex = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
    room.playedTrackIndices.push(randIndex);
    const selectedTrack = room.tracks[randIndex];

    // Determine start offset
    let startOffset = 0;
    if (room.config.startPosition === 'random') {
      // Max offset so snippet doesn't exceed 30s preview
      const maxOffset = Math.max(0, 30 - room.config.snippetDuration);
      startOffset = Math.floor(Math.random() * maxOffset);
    }

    room.currentTrack = {
      ...selectedTrack,
      startOffset: startOffset
    };

    // Reset player round guess flags
    roomManager.resetPlayerRound(room);

    return true;
  }

  socket.on('submit-guess', ({ roomId, userId, guess }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.status !== 'PLAYING') return;

    const player = room.players.get(userId);
    if (!player) return;

    // If already guessed both, skip
    if (player.guessedTitle && player.guessedArtist) return;

    const { titleMatch, artistMatch } = roomManager.evaluateGuess(guess, room.currentTrack);

    let pointsEarned = 0;
    let newTitleMatch = false;
    let newArtistMatch = false;

    // Award title points if not already guessed
    if (titleMatch && !player.guessedTitle) {
      player.guessedTitle = true;
      const titlePoints = 300 + (room.timerSeconds * 30);
      player.titlePoints = titlePoints;
      player.score += titlePoints;
      pointsEarned += titlePoints;
      newTitleMatch = true;
    }

    // Award artist points if not already guessed
    if (artistMatch && !player.guessedArtist) {
      player.guessedArtist = true;
      const artPoints = 200 + (room.timerSeconds * 20);
      player.artistPoints = artPoints;
      player.score += artPoints;
      pointsEarned += artPoints;
      newArtistMatch = true;
    }

    if (pointsEarned > 0) {
      player.lastPoints += pointsEarned;
    }

    // Send result back to the player who guessed
    socket.emit('guess-result', {
      titleMatch: newTitleMatch,
      artistMatch: newArtistMatch,
      alreadyGuessedTitle: player.guessedTitle,
      alreadyGuessedArtist: player.guessedArtist,
      points: pointsEarned
    });

    // Check if all active players guessed both
    const allFullyGuessed = Array.from(room.players.values()).every(
      p => p.guessedTitle && p.guessedArtist
    );
    if (allFullyGuessed) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.status = 'REVEALED';
    }

    broadcastRoomUpdate(roomId);
  });

  socket.on('reveal-answer', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = 'REVEALED';
    broadcastRoomUpdate(roomId);
  });

  socket.on('next-track', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    room.currentTrackIndex += 1;
    const hasNext = pickNextTrack(room);
    if (hasNext) {
      room.status = 'PLAYING';
      startRoundTimer(room);
    }
  });

  socket.on('restart-game', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== currentUserId) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.status = 'LOBBY';
    room.currentTrackIndex = 0;
    room.playedTrackIndices = [];
    room.currentTrack = null;
    roomManager.resetPlayerScores(room);
    broadcastRoomUpdate(roomId);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && currentUserId) {
      roomManager.removePlayer(currentRoomId, currentUserId);
      broadcastRoomUpdate(currentRoomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 Spotify Song Quiz Server rodando na porta ${PORT}`);
});
