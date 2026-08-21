import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer({ currentTrack, isHost, audioHostOnly, status }) {
  const audioRef = useRef(null);

  const shouldPlaySound = !audioHostOnly || isHost;

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.previewUrl) return;

    if (status === 'PLAYING') {
      audioRef.current.currentTime = currentTrack.startOffset || 0;
      if (shouldPlaySound) {
        audioRef.current.play().catch(err => {
          console.warn('Autoplay bloqueado pelo navegador. Clique para interagir.', err);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, status, shouldPlaySound]);

  if (!currentTrack?.previewUrl) return null;

  return (
    <div style={{ display: 'none' }}>
      <audio
        ref={audioRef}
        src={currentTrack.previewUrl}
        preload="auto"
      />
    </div>
  );
}
