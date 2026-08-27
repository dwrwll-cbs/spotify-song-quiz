import React, { useState, useEffect } from 'react';
import { Play, Plus, Users, Link2, AlertCircle, Loader } from 'lucide-react';
import { getApiUrl } from '../socket.js';
import { getPlaylistTracksDirect } from '../spotifyAuth.js';
import SpotifyLogin from './SpotifyLogin.jsx';
import PlaylistPicker from './PlaylistPicker.jsx';

const AVATARS = ['🎵', '🎸', '🎧', '🎤', '🎷', '🥁', '🎹', '🎺'];

export default function Home({ onCreateRoom, onJoinRoom, error, spotifyUser, onSpotifyLogout }) {
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('🎵');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [playlistSource, setPlaylistSource] = useState('url'); // 'url' | 'my-playlists'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Auto-fill name from Spotify profile
  useEffect(() => {
    if (spotifyUser?.display_name && !userName) {
      setUserName(spotifyUser.display_name);
    }
  }, [spotifyUser]);

  // Auto-switch to my playlists when logged in
  useEffect(() => {
    if (spotifyUser) {
      setPlaylistSource('my-playlists');
    }
  }, [spotifyUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
      setMode('join');
    }
  }, []);

  // Get avatar — use Spotify photo if available
  const getAvatar = () => {
    if (spotifyUser?.images?.[0]?.url) {
      return spotifyUser.images[0].url;
    }
    return avatar;
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!userName.trim()) {
      setLocalError('Por favor, informe seu apelido.');
      return;
    }

    if (mode === 'create') {
      setLoading(true);

      try {
        let playlistData;

        if (playlistSource === 'my-playlists' && selectedPlaylist) {
          // Fetch tracks directly from Spotify (client-side, token never leaves browser)
          playlistData = await getPlaylistTracksDirect(selectedPlaylist.id);
          if (!playlistData.tracks?.length) {
            throw new Error('Nenhuma música com áudio preview encontrada nesta playlist.');
          }
        } else {
          // Original flow — paste URL
          const urlToUse = playlistUrl.trim() || 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
          const res = await fetch(getApiUrl('/api/playlist'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToUse })
          });
          playlistData = await res.json();
          if (!res.ok) throw new Error(playlistData.error || 'Erro ao importar playlist.');
        }

        onCreateRoom({ userName, avatar: getAvatar(), playlist: playlistData });
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
      onJoinRoom({ userName, avatar: getAvatar(), roomId: roomCode.trim().toUpperCase() });
    }
  };

  return (
    <div className="home-container">
      <div className="glass-card home-card">
        {/* Hero */}
        <div className="text-center" style={{ marginBottom: '28px' }}>
          <div className="home-logo">🎵</div>
          <h1 className="home-title">SongQuiz</h1>
          <p className="card-subtitle">
            Ouça trechos de músicas e descubra qual é. Jogue com seus amigos!
          </p>
        </div>

        {/* Spotify Login */}
        <div style={{ marginBottom: '20px' }}>
          <SpotifyLogin spotifyUser={spotifyUser} onLogout={onSpotifyLogout} />
        </div>

        {(error || localError) && (
          <div className="error-banner">
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

          {/* Avatar — hide emoji grid if Spotify photo available */}
          {!spotifyUser?.images?.[0]?.url && (
            <div className="input-group">
              <label className="input-label">Avatar</label>
              <div className="avatar-grid">
                {AVATARS.map((emoji) => (
                  <div
                    key={emoji}
                    className={`avatar-option ${avatar === emoji ? 'active' : ''}`}
                    onClick={() => setAvatar(emoji)}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              type="button"
              className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              <Plus size={18} />
              <span>Criar Sala</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
              onClick={() => setMode('join')}
            >
              <Users size={18} />
              <span>Entrar em Sala</span>
            </button>
          </div>

          {mode === 'create' ? (
            <div className="input-group">
              {/* Source toggle if logged in */}
              {spotifyUser && (
                <div className="playlist-source-toggle">
                  <button
                    type="button"
                    className={`source-btn ${playlistSource === 'my-playlists' ? 'active' : ''}`}
                    onClick={() => setPlaylistSource('my-playlists')}
                  >
                    🎧 Minhas Playlists
                  </button>
                  <button
                    type="button"
                    className={`source-btn ${playlistSource === 'url' ? 'active' : ''}`}
                    onClick={() => setPlaylistSource('url')}
                  >
                    <Link2 size={14} /> Colar Link
                  </button>
                </div>
              )}

              {playlistSource === 'my-playlists' && spotifyUser ? (
                <PlaylistPicker
                  onSelectPlaylist={(pl) => setSelectedPlaylist(pl)}
                  selectedPlaylistId={selectedPlaylist?.id}
                />
              ) : (
                <>
                  <label className="input-label">
                    <Link2 size={16} /> Link da Playlist do Spotify
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Cole o link (ex: https://open.spotify.com/playlist/...)"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                  />
                  <span className="input-hint">
                    Deixe em branco para uma playlist de demonstração.
                  </span>
                </>
              )}
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
                style={{ textTransform: 'uppercase', letterSpacing: '3px', textAlign: 'center', fontWeight: '800', fontSize: '1.3rem' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || (mode === 'create' && playlistSource === 'my-playlists' && !selectedPlaylist)}
          >
            {loading ? (
              <>
                <Loader size={20} className="spin" />
                <span>Buscando Músicas...</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>{mode === 'create' ? 'Criar Sala & Configurar' : 'Entrar na Sala'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
