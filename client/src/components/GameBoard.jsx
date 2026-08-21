import React, { useState, useEffect } from 'react';
import { socket } from '../socket.js';
import { Music, Award, Eye, SkipForward, Send, CheckCircle, XCircle } from 'lucide-react';

export default function GameBoard({
  roomState,
  userId,
  isHost,
  onSubmitGuess,
  onRevealAnswer,
  onNextTrack
}) {
  const { currentTrack, currentTrackIndex, totalSongs, timerSeconds, status, players, config } = roomState;
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState(null); // { titleMatch, artistMatch, points }
  const [shakeInput, setShakeInput] = useState(false);

  const me = players.find((p) => p.id === userId);
  const isRevealed = status === 'REVEALED';
  const guessedTitle = me?.guessedTitle || false;
  const guessedArtist = me?.guessedArtist || false;
  const fullyGuessed = guessedTitle && guessedArtist;

  useEffect(() => {
    setGuessInput('');
    setGuessResult(null);
  }, [currentTrackIndex]);

  // Listen for guess results
  useEffect(() => {
    const handleResult = (result) => {
      setGuessResult(result);
      if (!result.titleMatch && !result.artistMatch && result.points === 0) {
        // Wrong guess — shake animation
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 500);
      } else {
        // Clear input on correct
        setGuessInput('');
      }
    };

    socket.on('guess-result', handleResult);
    return () => socket.off('guess-result', handleResult);
  }, []);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!guessInput.trim() || fullyGuessed || isRevealed) return;
    onSubmitGuess(guessInput.trim());
  };

  const timerColor = timerSeconds <= 5 ? '#ef4444' : timerSeconds <= 10 ? '#f59e0b' : 'var(--spotify-green)';

  return (
    <div className="glass-card game-board" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header Info */}
      <div className="game-header">
        <div className="game-track-info">
          <Music size={18} />
          <span>Música {currentTrackIndex + 1} de {totalSongs}</span>
        </div>
        <div className="game-score">
          <Award size={18} />
          <span>{me?.score || 0} pts</span>
        </div>
      </div>

      {/* Playing State */}
      {!isRevealed ? (
        <div className="text-center game-playing">
          {/* Audio Visualizer */}
          <div className="visualizer">
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
          </div>

          {/* Timer */}
          <div className="timer-container">
            <div className="timer-circle" style={{ borderColor: timerColor, boxShadow: `0 0 24px ${timerColor}33` }}>
              <span style={{ color: timerColor }}>{timerSeconds}</span>
            </div>
            <div className="timer-label">segundos restantes</div>
          </div>

          {/* Guess Status Badges */}
          <div className="guess-badges">
            <div className={`guess-badge ${guessedTitle ? 'correct' : ''}`}>
              {guessedTitle ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>Título {guessedTitle ? `✓ (+${me?.titlePoints || 0})` : ''}</span>
            </div>
            <div className={`guess-badge ${guessedArtist ? 'correct' : ''}`}>
              {guessedArtist ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>Artista {guessedArtist ? `✓ (+${me?.artistPoints || 0})` : ''}</span>
            </div>
          </div>

          {/* Guess Input */}
          {fullyGuessed ? (
            <div className="guess-complete">
              ✨ Você acertou tudo! (+{me?.lastPoints || 0} pts)
            </div>
          ) : (
            <form onSubmit={handleGuessSubmit} className="guess-form">
              <div className={`guess-input-wrapper ${shakeInput ? 'shake' : ''}`}>
                <input
                  type="text"
                  className={`text-input guess-input ${guessedTitle ? 'title-ok' : ''} ${guessedArtist ? 'artist-ok' : ''}`}
                  placeholder={
                    guessedTitle ? 'Agora adivinhe o artista...'
                    : guessedArtist ? 'Agora adivinhe a música...'
                    : 'Qual é a música ou artista?'
                  }
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="guess-send-btn" disabled={!guessInput.trim()}>
                  <Send size={20} />
                </button>
              </div>
              {guessResult && !guessResult.titleMatch && !guessResult.artistMatch && guessResult.points === 0 && (
                <div className="guess-wrong">Tente novamente!</div>
              )}
            </form>
          )}
        </div>
      ) : (
        /* Revealed State */
        <div className="album-reveal-card">
          <img
            src={currentTrack?.albumCover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60'}
            alt={currentTrack?.title}
            className="album-cover"
          />
          <div>
            <h2 className="track-title">{currentTrack?.title}</h2>
            <div className="track-artist">{currentTrack?.artist}</div>
          </div>
          {!fullyGuessed && (
            <div className="reveal-miss">Você não acertou tudo dessa vez 😔</div>
          )}
        </div>
      )}

      {/* Host Controls */}
      {isHost && (
        <div className="host-controls">
          {!isRevealed ? (
            <button className="btn btn-secondary" onClick={onRevealAnswer}>
              <Eye size={18} />
              <span>Revelar Resposta</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onNextTrack} style={{ minWidth: '200px' }}>
              <SkipForward size={20} />
              <span>Próxima Música</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
