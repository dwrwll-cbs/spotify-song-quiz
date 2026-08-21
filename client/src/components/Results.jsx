import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Medal } from 'lucide-react';

export default function Results({ players, isHost, onRestartGame }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  useEffect(() => {
    // Trigger festive confetti animation
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="glass-card text-center" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <Trophy size={64} color="#1db954" style={{ filter: 'drop-shadow(0 0 16px var(--spotify-green-glow))', marginBottom: '12px' }} />
      <h1 className="card-title" style={{ justifyContent: 'center', fontSize: '2.2rem' }}>
        Fim de Jogo!
      </h1>
      <p className="card-subtitle">
        Parabéns a <strong style={{ color: 'var(--spotify-green)' }}>{winner?.name}</strong> por conquistar o primeiro lugar!
      </p>

      {/* Winner Spotlight */}
      <div style={{ background: 'rgba(29, 185, 84, 0.1)', border: '1px solid var(--spotify-green)', borderRadius: '16px', padding: '24px', margin: '24px 0' }}>
        <div style={{ fontSize: '2.5rem' }}>{winner?.avatar}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '8px' }}>{winner?.name}</div>
        <div style={{ color: 'var(--spotify-green)', fontSize: '1.2rem', fontWeight: '800', marginTop: '4px' }}>
          {winner?.score} Pontos
        </div>
      </div>

      {/* Complete Rankings */}
      <div style={{ textAlign: 'left', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Classificação Final</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="player-card"
              style={{
                background: idx === 0 ? 'rgba(29, 185, 84, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: idx === 0 ? 'var(--spotify-green)' : 'var(--border-color)'
              }}
            >
              <div className="player-name">
                <Medal size={20} color={idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'transparent'} />
                <span>#{idx + 1}</span>
                <span>{player.avatar}</span>
                <span style={{ fontWeight: '700' }}>{player.name}</span>
              </div>
              <span className="player-score" style={{ fontSize: '1.1rem' }}>{player.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Host Restart Option */}
      {isHost ? (
        <button
          className="btn btn-primary"
          onClick={onRestartGame}
          style={{ width: '100%', marginTop: '32px', fontSize: '1.1rem' }}
        >
          <RotateCcw size={20} />
          <span>Jogar Novamente</span>
        </button>
      ) : (
        <div style={{ marginTop: '24px', color: 'var(--text-muted)' }}>
          Aguardando o Host reiniciar a partida...
        </div>
      )}
    </div>
  );
}
