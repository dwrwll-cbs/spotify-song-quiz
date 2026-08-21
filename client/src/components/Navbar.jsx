import React, { useState } from 'react';
import { Music, Copy, Check, Users } from 'lucide-react';

export default function Navbar({ roomId, roomState }) {
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="app-header">
      <div className="brand">
        <Music className="brand-icon" size={28} />
        <span>SongQuiz</span>
      </div>

      {roomId && (
        <div className="flex-row">
          <div className="room-badge">
            <Users size={16} />
            <span>Sala:</span>
            <span className="room-code-tag">{roomId}</span>
          </div>

          <button className="btn btn-secondary" onClick={handleCopyInvite} title="Copiar link de convite">
            {copied ? <Check size={18} color="#1db954" /> : <Copy size={18} />}
            <span>{copied ? 'Link Copiado!' : 'Convidar'}</span>
          </button>
        </div>
      )}
    </header>
  );
}
