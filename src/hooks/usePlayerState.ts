import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';

// For demo mode (no Spotify): tick the counter
export function usePlayerState(isSpotifyConnected: boolean) {
  const { isPlaying, setCurrentTime, setProgress, tracks, currentIndex, skipTrack } = usePlayerStore();

  useEffect(() => {
    if (isSpotifyConnected) return;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev: number) => {
        const track = tracks[currentIndex];
        if (!track) return prev;
        const next = prev + 1;
        if (next >= track.duration) {
          skipTrack(1);
          return 0;
        }
        setProgress(next / track.duration);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isSpotifyConnected, currentIndex, tracks]);
}
