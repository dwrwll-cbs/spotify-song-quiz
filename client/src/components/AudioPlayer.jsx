import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Repeat, Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function AudioPlayer({ currentTrack, isHost, audioHostOnly, status, snippetDuration }) {
  const audioRef = useRef(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const snippetTimerRef = useRef(null);

  const shouldPlaySound = !audioHostOnly || isHost;
  const startOffset = currentTrack?.startOffset || 0;
  const duration = snippetDuration || 10;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (snippetTimerRef.current) {
      clearTimeout(snippetTimerRef.current);
      snippetTimerRef.current = null;
    }
  }, []);

  const playSnippet = useCallback(() => {
    if (!audioRef.current || !currentTrack?.previewUrl || !shouldPlaySound) return;

    audioRef.current.currentTime = startOffset;
    audioRef.current.play().then(() => {
      setIsPlaying(true);

      // Stop after snippetDuration if not looping
      if (!isLooping) {
        if (snippetTimerRef.current) clearTimeout(snippetTimerRef.current);
        snippetTimerRef.current = setTimeout(() => {
          if (!isLooping) {
            stopAudio();
          }
        }, duration * 1000);
      }
    }).catch(err => {
      console.warn('Autoplay bloqueado pelo navegador.', err);
    });
  }, [currentTrack, startOffset, duration, isLooping, shouldPlaySound, stopAudio]);

  // Handle time update for looping
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (isLooping && audio.currentTime >= startOffset + duration) {
        audio.currentTime = startOffset;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isLooping, startOffset, duration]);

  // Play when status becomes PLAYING with a new track
  useEffect(() => {
    if (status === 'PLAYING' && currentTrack?.previewUrl) {
      // Small delay to let audio source load
      const t = setTimeout(() => playSnippet(), 100);
      return () => clearTimeout(t);
    } else if (status !== 'PLAYING') {
      // Don't stop audio on REVEALED — let it keep playing so users can hear
    }
  }, [currentTrack?.id, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const toggleLoop = () => {
    const newLoop = !isLooping;
    setIsLooping(newLoop);

    if (newLoop && !isPlaying && status === 'PLAYING') {
      playSnippet();
    }

    // If turning loop off while playing, set timeout for remaining duration
    if (!newLoop && isPlaying && audioRef.current) {
      const elapsed = audioRef.current.currentTime - startOffset;
      const remaining = Math.max(0, duration - elapsed);
      if (snippetTimerRef.current) clearTimeout(snippetTimerRef.current);
      snippetTimerRef.current = setTimeout(() => {
        stopAudio();
      }, remaining * 1000);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playSnippet();
    }
  };

  if (!currentTrack?.previewUrl) return null;
  if (status !== 'PLAYING' && status !== 'REVEALED') return null;

  return (
    <div className="audio-controls-bar">
      <audio ref={audioRef} src={currentTrack.previewUrl} preload="auto" />

      <div className="audio-controls-inner">
        <button
          className={`audio-btn ${isPlaying ? 'active' : ''}`}
          onClick={togglePlayPause}
          title={isPlaying ? 'Pausar' : 'Tocar'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          className={`audio-btn ${isLooping ? 'loop-active' : ''}`}
          onClick={toggleLoop}
          title={isLooping ? 'Desativar loop' : 'Ativar loop'}
        >
          <Repeat size={18} />
        </button>

        <button
          className="audio-btn"
          onClick={toggleMute}
          title={isMuted ? 'Ativar som' : 'Mutar'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <span className="audio-label">
          {isPlaying ? (isLooping ? '🔁 Loop' : '▶ Tocando') : '⏸ Pausado'}
          {' · '}
          {duration}s trecho
        </span>
      </div>
    </div>
  );
}
