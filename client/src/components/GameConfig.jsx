import React from 'react';
import { Settings, Play, Clock, Hash, Music, Volume2, ShieldCheck } from 'lucide-react';

const NUM_SONGS_OPTIONS = [5, 10, 15, 20];
const DURATION_OPTIONS = [5, 10, 15, 20, 30];

export default function GameConfig({ roomState, isHost, onUpdateConfig, onStartGame }) {
  const { config, playlist, players } = roomState;

  const handleConfigChange = (key, value) => {
    if (!isHost) return;
    onUpdateConfig({ [key]: value });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card-title">
        <Settings className="brand-icon" size={24} />
        <span>Configuração da Partida</span>
      </div>
      <p className="card-subtitle">
        {isHost ? 'Ajuste as regras do jogo e aguarde os jogadores para iniciar.' : 'Aguarde o Host iniciar a partida.'}
      </p>

      {/* Playlist Stats */}
      {playlist && (
        <div className="flex-row" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          {playlist.image && (
            <img src={playlist.image} alt={playlist.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{playlist.name}</div>
            <div style={{ color: 'var(--spotify-green)', fontSize: '0.9rem', marginTop: '2px' }}>
              🎵 {playlist.totalFound} músicas com trecho encontradas
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="input-group">
        <label className="input-label">
          <Hash size={16} /> Quantidade de Músicas
        </label>
        <div className="pill-grid">
          {NUM_SONGS_OPTIONS.map((num) => (
            <div
              key={num}
              className={`pill-option ${config.numSongs === num ? 'active' : ''}`}
              onClick={() => handleConfigChange('numSongs', num)}
              style={{ cursor: isHost ? 'pointer' : 'default' }}
            >
              {num} músicas
            </div>
          ))}
        </div>
      </div>

      <div className="input-group" style={{ marginTop: '16px' }}>
        <label className="input-label">
          <Clock size={16} /> Duração do Trecho (Segundos)
        </label>
        <div className="pill-grid">
          {DURATION_OPTIONS.map((dur) => (
            <div
              key={dur}
              className={`pill-option ${config.sampleDuration === dur ? 'active' : ''}`}
              onClick={() => handleConfigChange('sampleDuration', dur)}
              style={{ cursor: isHost ? 'pointer' : 'default' }}
            >
              {dur}s
            </div>
          ))}
        </div>
      </div>

      <div className="input-group" style={{ marginTop: '16px' }}>
        <label className="input-label">
          <Music size={16} /> Posição de Início do Trecho
        </label>
        <div className="pill-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div
            className={`pill-option ${config.startPosition === 'beginning' ? 'active' : ''}`}
            onClick={() => handleConfigChange('startPosition', 'beginning')}
            style={{ cursor: isHost ? 'pointer' : 'default' }}
          >
            Início da Música (0s)
          </div>
          <div
            className={`pill-option ${config.startPosition === 'random' ? 'active' : ''}`}
            onClick={() => handleConfigChange('startPosition', 'random')}
            style={{ cursor: isHost ? 'pointer' : 'default' }}
          >
            Posição Aleatória
          </div>
        </div>
      </div>

      {/* Host Audio Only Toggle */}
      <div
        className={`toggle-switch ${config.audioHostOnly ? 'active' : ''}`}
        onClick={() => handleConfigChange('audioHostOnly', !config.audioHostOnly)}
        style={{ cursor: isHost ? 'pointer' : 'default', marginTop: '20px' }}
      >
        <div className="flex-row">
          <Volume2 size={20} color={config.audioHostOnly ? '#1db954' : '#94a3b8'} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Áudio Apenas no Host (Modo Festa)</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Se ativado, apenas a caixa de som do Host tocará o trecho.
            </div>
          </div>
        </div>
        <div style={{ fontWeight: '800', color: config.audioHostOnly ? 'var(--spotify-green)' : 'var(--text-muted)' }}>
          {config.audioHostOnly ? 'SIM' : 'NÃO'}
        </div>
      </div>

      {/* Players list in Lobby */}
      <div style={{ marginTop: '28px' }}>
        <div className="input-label" style={{ marginBottom: '10px' }}>
          Jogadores Conectados ({players.length})
        </div>
        <div className="players-grid">
          {players.map((p) => (
            <div key={p.id} className="player-card">
              <div className="player-name">
                <span>{p.avatar}</span>
                <span>{p.name}</span>
              </div>
              {p.isHost && <span className="badge-host">Host</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      {isHost ? (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '32px', fontSize: '1.1rem' }}
          onClick={onStartGame}
        >
          <Play size={22} />
          <span>Começar Partida</span>
        </button>
      ) : (
        <div className="text-center" style={{ marginTop: '24px', color: 'var(--spotify-green)', fontWeight: '600' }}>
          Aguardando o Host iniciar a partida...
        </div>
      )}
    </div>
  );
}
