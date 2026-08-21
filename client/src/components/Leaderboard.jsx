import React from 'react';
import { Trophy, CheckCircle2, Music, User } from 'lucide-react';

export default function Leaderboard({ players }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <div className="card-title" style={{ fontSize: '1.1rem' }}>
        <Trophy className="brand-icon" size={20} />
        <span>Placar da Partida</span>
      </div>

      <div className="players-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {sortedPlayers.map((player, idx) => (
          <div key={player.id} className={`player-card ${(player.guessedTitle || player.guessedArtist) ? 'guessed' : ''}`}>
            <div className="player-name">
              <span style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                #{idx + 1}
              </span>
              <span>{player.avatar}</span>
              <span>{player.name}</span>
            </div>

            <div className="flex-row" style={{ gap: '8px' }}>
              <div className="guess-icons">
                {player.guessedTitle && (
                  <span className="mini-badge title-badge" title="Acertou o título">
                    <Music size={12} />
                  </span>
                )}
                {player.guessedArtist && (
                  <span className="mini-badge artist-badge" title="Acertou o artista">
                    <User size={12} />
                  </span>
                )}
              </div>
              <span className="player-score">{player.score} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
