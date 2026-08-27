import React, { useState, useEffect, useCallback } from 'react';
import { socket } from './socket.js';
import { getStoredAuth, getSpotifyUser, isLoggedIn, logoutSpotify, handleSpotifyCallback } from './spotifyAuth.js';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import GameConfig from './components/GameConfig.jsx';
import GameBoard from './components/GameBoard.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Results from './components/Results.jsx';
import AudioPlayer from './components/AudioPlayer.jsx';
import SpotifyCallback from './components/SpotifyCallback.jsx';

export default function App() {
  const [userId] = useState(() => {
    const saved = sessionStorage.getItem('sq_user_id');
    if (saved) return saved;
    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('sq_user_id', newId);
    return newId;
  });

  const [roomId, setRoomId] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Spotify auth state
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [isCallback, setIsCallback] = useState(false);

  // Check if we're on the /callback route
  useEffect(() => {
    if (window.location.pathname === '/callback') {
      setIsCallback(true);
    }
  }, []);

  // Load Spotify user on mount if already logged in
  useEffect(() => {
    if (isCallback) return;
    async function loadUser() {
      if (isLoggedIn()) {
        try {
          const user = await getSpotifyUser();
          setSpotifyUser(user);
        } catch {
          // Token might be expired, user will see login button
          setSpotifyUser(null);
        }
      }
    }
    loadUser();
  }, [isCallback]);

  const handleAuthComplete = useCallback(async () => {
    try {
      const user = await getSpotifyUser();
      setSpotifyUser(user);
    } catch {
      // Ignore
    }
    setIsCallback(false);
  }, []);

  const handleSpotifyLogout = useCallback(() => {
    logoutSpotify();
    setSpotifyUser(null);
  }, []);

  useEffect(() => {
    socket.on('room-created', (room) => {
      setRoomId(room.id);
      setRoomState(room);
    });

    socket.on('room-updated', (room) => {
      setRoomState(room);
    });

    socket.on('timer-tick', (seconds) => {
      setRoomState((prev) => (prev ? { ...prev, timerSeconds: seconds } : prev));
    });

    socket.on('error-message', (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 4000);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('timer-tick');
      socket.off('error-message');
    };
  }, []);

  const handleCreateRoom = ({ userName, avatar, playlist }) => {
    socket.emit('create-room', { hostId: userId, hostName: userName, avatar });
    socket.once('room-created', (room) => {
      socket.emit('set-playlist', { roomId: room.id, playlist });
    });
  };

  const handleJoinRoom = ({ userName, avatar, roomId: targetRoomId }) => {
    setRoomId(targetRoomId);
    socket.emit('join-room', { roomId: targetRoomId, userId, userName, avatar });
  };

  const handleUpdateConfig = (config) => {
    if (!roomId) return;
    socket.emit('update-config', { roomId, config });
  };

  const handleStartGame = () => {
    if (!roomId) return;
    socket.emit('start-game', { roomId });
  };

  const handleSubmitGuess = (guess) => {
    if (!roomId) return;
    socket.emit('submit-guess', { roomId, userId, guess });
  };

  const handleRevealAnswer = () => {
    if (!roomId) return;
    socket.emit('reveal-answer', { roomId });
  };

  const handleNextTrack = () => {
    if (!roomId) return;
    socket.emit('next-track', { roomId });
  };

  const handleRestartGame = () => {
    if (!roomId) return;
    socket.emit('restart-game', { roomId });
  };

  // OAuth callback page
  if (isCallback) {
    return (
      <div className="app-container">
        <SpotifyCallback onAuthComplete={handleAuthComplete} />
      </div>
    );
  }

  const isHost = roomState?.hostId === userId;

  return (
    <div className="app-container">
      <Navbar roomId={roomId} roomState={roomState} spotifyUser={spotifyUser} />

      <AudioPlayer
        currentTrack={roomState?.currentTrack}
        isHost={isHost}
        audioHostOnly={roomState?.config?.audioHostOnly}
        status={roomState?.status}
        snippetDuration={roomState?.config?.snippetDuration || 10}
      />

      {!roomState ? (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={errorMessage}
          spotifyUser={spotifyUser}
          onSpotifyLogout={handleSpotifyLogout}
        />
      ) : roomState.status === 'LOBBY' ? (
        <GameConfig
          roomState={roomState}
          isHost={isHost}
          onUpdateConfig={handleUpdateConfig}
          onStartGame={handleStartGame}
        />
      ) : roomState.status === 'GAME_OVER' ? (
        <Results
          players={roomState.players}
          isHost={isHost}
          onRestartGame={handleRestartGame}
        />
      ) : (
        <>
          <GameBoard
            roomState={roomState}
            userId={userId}
            isHost={isHost}
            onSubmitGuess={handleSubmitGuess}
            onRevealAnswer={handleRevealAnswer}
            onNextTrack={handleNextTrack}
          />
          <Leaderboard players={roomState.players} />
        </>
      )}
    </div>
  );
}
