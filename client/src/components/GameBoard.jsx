import React, { useState, useEffect } from 'react';
import { Play, Check, Eye, SkipForward, Music, Award, HelpCircle } from 'lucide-react';

export default function GameBoard({
  roomState,
  userId,
  isHost,
  onSubmitGuess,
  onRevealAnswer,
  onNextTrack
}) {
  const { currentTrack, currentTrackIndex, totalSongs, timerSeconds, status, players } = roomState;
  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const me = players.find((p) => p.id === userId);
  const isRevealed = status === 'REVEALED';

  useEffect(() => {
    // Reset local guess input on track change
    setGuessInput('');
    setFeedback(null);
  }, [currentTrackIndex]);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!guessInput.trim() || me?.guessed || isRevealed) return;

    onSubmitGuess(guessInput.trim(), false);
  };

  const handleManualHit = () => {
    if (me?.guessed || isRevealed) return;
    onSubmitGuess('ACERTEI', true);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header Info */}
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', color: 'var(--spotify-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={18} />
          <span>Música {currentTrackIndex + 1} de {totalSongs}</span>
        </div>
        <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>
          Sua Pontuação: <span style={{ color: 'var(--spotify-green)' }}>{me?.score || 0} pts</span>
        </div>
      </div>

      {/* Playing / Revealing State */}
      {!isRevealed ? (
        <div className="text-center" style={{ padding: '20px 0' }}>
          <div className="visualizer">
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
            <div className="v-bar"></div>
          </div>

          <div className="timer-container">
            <div className="timer-circle">
              {timerSeconds}
            </div>
            <div className="timer-label">Segundos Restantes</div>
          </div>

          {me?.guessed ? (
            <div style={{ color: 'var(--spotify-green)', fontWeight: '800', fontSize: '1.2rem', margin: '16px 0' }}>
              ✓ Você acertou! (+{me.lastPoints} pts)
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <form onSubmit={handleGuessSubmit} className="flex-row" style={{ gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Qual é a música ou artista?"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  disabled={me?.guessed}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" disabled={!guessInput.trim()}>
                  Enviar
                </button>
              </form>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleManualHit}
                style={{ width: '100%', borderColor: 'var(--spotify-green)', color: 'var(--spotify-green)' }}
              >
                <Check size={18} />
                <span>Acertei! (Pontuar)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Revealed State */
        <div className="album-reveal-card" style={{ padding: '20px 0' }}>
          <img
            src={currentTrack?.albumCover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60'}
            alt={currentTrack?.title}
            className="album-cover"
          />

          <div>
            <h2 className="track-title">{currentTrack?.title}</h2>
            <div className="track-artist">{currentTrack?.artist}</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            Trecho encerrado! Veja quem pontuou no placar abaixo.
          </div>
        </div>
      )}

      {/* Host Controls */}
      {isHost && (
        <div className="flex-row" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', justifyContent: 'center' }}>
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
