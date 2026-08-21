import React from 'react';
import { Settings, Play, Clock, Hash, Music, Volume2, Timer, Copy, Check, Link2 } from 'lucide-react';

const NUM_SONGS_OPTIONS = [5, 10, 15, 20];
const ANSWER_TIME_OPTIONS = [30, 45, 60, 90, 120];

export default function GameConfig({ roomState, isHost, onUpdateConfig, onStartGame }) {
  const { config, playlist, players, id: roomId } = roomState;
  const [copied, setCopied] = React.useState(false);

  const handleConfigChange = (key, value) => {
    if (!isHost) return;
    onUpdateConfig({ [key]: value });
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="config-container">
      {/* Invite Section */}
      <div className="glass-card invite-card">
        <div className="invite-header">
          <div>
            <div className="invite-title">Convide seus amigos!</div>
            <div className="invite-subtitle">Compartilhe o código ou link abaixo</div>
          </div>
          <div className="invite-code">{roomId}</div>
        </div>
        <button className="btn btn-secondary btn-full" onClick={handleCopyInvite}>
          {copied ? <Check size={18} color="#1db954" /> : <Copy size={18} />}
          <span>{copied ? 'Link Copiado!' : 'Copiar Link de Convite'}</span>
        </button>
      </div>

      <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="card-title">
          <Settings className="brand-icon" size={24} />
          <span>Configuração da Partida</span>
        </div>
        <p className="card-subtitle">
          {isHost ? 'Ajuste as regras e inicie quando todos estiverem prontos.' : 'Aguarde o Host iniciar a partida.'}
        </p>

        {/* Playlist Stats */}
        {playlist && (
          <div className="playlist-info">
            {playlist.image && (
              <img src={playlist.image} alt={playlist.name} className="playlist-thumb" />
            )}
            <div>
              <div className="playlist-name">{playlist.name}</div>
              <div className="playlist-count">
                🎵 {playlist.totalFound} músicas com trecho
              </div>
            </div>
          </div>
        )}

        {/* Number of Songs */}
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

        {/* Snippet Duration — Slider 1-30s */}
        <div className="input-group" style={{ marginTop: '16px' }}>
          <label className="input-label">
            <Music size={16} /> Duração do Trecho de Áudio
          </label>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="30"
              value={config.snippetDuration || 10}
              onChange={(e) => handleConfigChange('snippetDuration', parseInt(e.target.value))}
              className="range-slider"
              disabled={!isHost}
            />
            <div className="slider-value">{config.snippetDuration || 10}s</div>
          </div>
          <span className="input-hint">
            Quanto do áudio será tocado (1 a 30 segundos).
          </span>
        </div>

        {/* Answer Time */}
        <div className="input-group" style={{ marginTop: '16px' }}>
          <label className="input-label">
            <Timer size={16} /> Tempo para Responder
          </label>
          <div className="pill-grid">
            {ANSWER_TIME_OPTIONS.map((t) => (
              <div
                key={t}
                className={`pill-option ${(config.answerTime || 30) === t ? 'active' : ''}`}
                onClick={() => handleConfigChange('answerTime', t)}
                style={{ cursor: isHost ? 'pointer' : 'default' }}
              >
                {t}s
              </div>
            ))}
          </div>
          <span className="input-hint">
            Tempo total que cada jogador tem para adivinhar.
          </span>
        </div>

        {/* Start Position */}
        <div className="input-group" style={{ marginTop: '16px' }}>
          <label className="input-label">
            <Clock size={16} /> Posição de Início
          </label>
          <div className="pill-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className={`pill-option ${config.startPosition === 'beginning' ? 'active' : ''}`}
              onClick={() => handleConfigChange('startPosition', 'beginning')}
              style={{ cursor: isHost ? 'pointer' : 'default' }}
            >
              Início (0s)
            </div>
            <div
              className={`pill-option ${config.startPosition === 'random' ? 'active' : ''}`}
              onClick={() => handleConfigChange('startPosition', 'random')}
              style={{ cursor: isHost ? 'pointer' : 'default' }}
            >
              Aleatória
            </div>
          </div>
        </div>

        {/* Host Audio Only Toggle */}
        <div
          className={`toggle-switch ${config.audioHostOnly ? 'active' : ''}`}
          onClick={() => isHost && handleConfigChange('audioHostOnly', !config.audioHostOnly)}
          style={{ cursor: isHost ? 'pointer' : 'default', marginTop: '20px' }}
        >
          <div className="flex-row">
            <Volume2 size={20} color={config.audioHostOnly ? '#1db954' : '#94a3b8'} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Áudio Apenas no Host</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Som sai somente no dispositivo do Host.
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
            className="btn btn-primary btn-full"
            style={{ marginTop: '32px', fontSize: '1.1rem' }}
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
    </div>
  );
}
