import React, { useState, useEffect } from 'react';
import { Play, Plus, Users, Link2, Sparkles, AlertCircle } from 'lucide-react';

const AVATARS = ['🎵', '🎸', '🎧', '🎤', '🎷', '🥁', '🎹', '🎺'];

export default function Home({ onStartSolo, onCreateRoom, onJoinRoom, error }) {
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('🎵');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!userName.trim()) {
      setLocalError('Por favor, informe seu apelido.');
      return;
    }

    if (mode === 'create') {
      const urlToUse = playlistUrl.trim() || 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
      setLoading(true);
      try {
        const res = await fetch('/api/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToUse })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao importar playlist.');

        onCreateRoom({ userName, avatar, playlist: data });
      } catch (err) {
        setLocalError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!roomCode.trim()) {
        setLocalError('Informe o código da sala.');
        return;
      }
      onJoinRoom({ userName, avatar, roomId: roomCode.trim().toUpperCase() });
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <h1 className="card-title" style={{ justifyContent: 'center', fontSize: '2rem' }}>
          SongQuiz
        </h1>
        <p className="card-subtitle">
          Teste seus conhecimentos ouvindo trechos de músicas de playlists do Spotify!
        </p>
      </div>

      {(error || localError) && (
        <div className="room-badge" style={{ borderColor: '#ef4444', color: '#ef4444', marginBottom: '20px', justifyContent: 'center' }}>
          <AlertCircle size={18} />
          <span>{error || localError}</span>
        </div>
      )}

      <form onSubmit={handleAction}>
        {/* User Info */}
        <div className="input-group">
          <label className="input-label">Seu Apelido</label>
          <input
            type="text"
            className="text-input"
            placeholder="Ex: DJ Adivinhão"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            maxLength={18}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Escolha seu Avatar</label>
          <div className="pill-grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
            {AVATARS.map((emoji) => (
              <div
                key={emoji}
                className={`pill-option ${avatar === emoji ? 'active' : ''}`}
                onClick={() => setAvatar(emoji)}
                style={{ fontSize: '1.4rem', padding: '8px' }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex-row" style={{ margin: '20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <button
            type="button"
            className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('create')}
            style={{ flex: 1 }}
          >
            <Plus size={18} />
            <span>Criar Sala</span>
          </button>
          <button
            type="button"
            className={`btn ${mode === 'join' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('join')}
            style={{ flex: 1 }}
          >
            <Users size={18} />
            <span>Entrar em Sala</span>
          </button>
        </div>

        {mode === 'create' ? (
          <div className="input-group">
            <label className="input-label">
              <Link2 size={16} /> Link da Playlist do Spotify
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="Cole o link da playlist (ex: https://open.spotify.com/playlist/...)"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Deixe em branco para carregar uma playlist global de demonstração.
            </span>
          </div>
        ) : (
          <div className="input-group">
            <label className="input-label">Código da Sala</label>
            <input
              type="text"
              className="text-input"
              placeholder="Ex: AB12CD"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '16px' }}
          disabled={loading}
        >
          {loading ? (
            <span>Buscando Músicas...</span>
          ) : (
            <>
              <Play size={20} />
              <span>{mode === 'create' ? 'Criar Sala & Configurar' : 'Entrar na Sala'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
