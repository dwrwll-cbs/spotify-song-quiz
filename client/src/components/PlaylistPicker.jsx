import React, { useState, useEffect } from 'react';
import { getUserPlaylists } from '../spotifyAuth.js';
import { Search, Music, Check, Loader, ChevronDown } from 'lucide-react';

export default function PlaylistPicker({ onSelectPlaylist, selectedPlaylistId }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        setLoading(true);
        const data = await getUserPlaylists(50, 0);
        if (data?.items) {
          setPlaylists(data.items);
        }
      } catch (err) {
        setError('Erro ao buscar playlists');
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylists();
  }, []);

  const filtered = playlists.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  if (loading) {
    return (
      <div className="playlist-picker-loading">
        <Loader size={24} className="spin" />
        <span>Carregando playlists...</span>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner"><span>{error}</span></div>;
  }

  return (
    <div className="playlist-picker">
      <div className="playlist-picker-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar playlist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="playlist-search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="playlist-picker-empty">
          <Music size={32} />
          <span>Nenhuma playlist encontrada</span>
        </div>
      ) : (
        <>
          <div className="playlist-picker-grid">
            {displayed.map((pl) => (
              <div
                key={pl.id}
                className={`playlist-picker-item ${selectedPlaylistId === pl.id ? 'selected' : ''}`}
                onClick={() => onSelectPlaylist(pl)}
              >
                <div className="playlist-picker-img-wrap">
                  {pl.images?.[0]?.url ? (
                    <img src={pl.images[0].url} alt={pl.name} className="playlist-picker-img" />
                  ) : (
                    <div className="playlist-picker-img-placeholder">
                      <Music size={24} />
                    </div>
                  )}
                  {selectedPlaylistId === pl.id && (
                    <div className="playlist-picker-check">
                      <Check size={20} />
                    </div>
                  )}
                </div>
                <div className="playlist-picker-details">
                  <span className="playlist-picker-name">{pl.name}</span>
                  <span className="playlist-picker-count">
                    {typeof pl.tracks?.total === 'number'
                      ? `${pl.tracks.total} músicas`
                      : typeof pl.total_tracks === 'number'
                      ? `${pl.total_tracks} músicas`
                      : 'Playlist Spotify'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!showAll && filtered.length > 6 && (
            <button className="btn btn-secondary btn-full" onClick={() => setShowAll(true)} style={{ marginTop: '12px' }}>
              <ChevronDown size={18} />
              <span>Ver todas ({filtered.length})</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
