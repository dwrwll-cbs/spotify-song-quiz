import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

export default function Leaderboard({ players }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <div className="card-title" style={{ fontSize: '1.1rem' }}>
        <Trophy className="brand-icon" size={20} />
        <span>Placar da Partida</span>
      </div>

      <div className="players-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {sortedPlayers.map((player, idx) => (
          <div key={player.id} className={`player-card ${player.guessed ? 'guessed' : ''}`}>
            <div className="player-name">
              <span style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                #{idx + 1}
              </span>
              <span>{player.avatar}</span>
              <span>{player.name}</span>
            </div>

            <div className="flex-row">
              {player.guessed && <CheckCircle2 size={16} color="#1db954" />}
              <span className="player-score">{player.score} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
