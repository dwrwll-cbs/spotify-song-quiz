import React, { useEffect, useState } from 'react';
import { handleSpotifyCallback } from '../spotifyAuth.js';
import { Loader } from 'lucide-react';

export default function SpotifyCallback({ onAuthComplete }) {
  const [error, setError] = useState('');

  useEffect(() => {
    async function processCallback() {
      try {
        const authData = await handleSpotifyCallback();
        if (onAuthComplete) {
          onAuthComplete(authData);
        }
      } catch (err) {
        setError(err.message);
        // Redirect home after error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    }
    processCallback();
  }, [onAuthComplete]);

  return (
    <div className="callback-container">
      <div className="glass-card callback-card">
        {error ? (
          <>
            <div className="callback-icon error">✕</div>
            <h2>Erro no Login</h2>
            <p className="card-subtitle">{error}</p>
            <p className="card-subtitle">Redirecionando...</p>
          </>
        ) : (
          <>
            <Loader size={48} className="spin" style={{ color: 'var(--spotify-green)' }} />
            <h2 style={{ marginTop: '16px' }}>Conectando ao Spotify...</h2>
            <p className="card-subtitle">Aguarde um momento</p>
          </>
        )}
      </div>
    </div>
  );
}
