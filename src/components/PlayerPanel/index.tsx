import { Turntable } from './Turntable';
import { NowPlaying } from './NowPlaying';
import { ProgressBar } from './ProgressBar';
import { Controls } from './Controls';
import { TapeDeck } from './TapeDeck';
import { StatusOverlay } from '../StatusOverlay/StatusOverlay';
import { usePlayerStore } from '../../store/playerStore';
import styles from './PlayerPanel.module.css';

interface Props {
  onTogglePlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSeek?: (posMs: number) => void;
  onUpdateMetadata?: (
    trackId: string,
    updates: {
      moodTag: string;
      memoryNote: string;
      shelfName: string;
      cassetteTheme: string;
      pinned: boolean;
      archived: boolean;
      unavailable: boolean;
      unavailableNote: string;
    }
  ) => void;
  onMoveTrack?: (trackId: string, dir: -1 | 1) => void;
  shelves?: string[];
}

export function PlayerPanel({
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onUpdateMetadata,
  onMoveTrack,
  shelves: _shelves,
}: Props) {
  const { isPlaying, tracks, currentIndex, progress, playerStatus } = usePlayerStore();
  const track = tracks[currentIndex];

  return (
    <div className={styles.panel}>
      <StatusOverlay />
      <div className={styles.nowLbl}>NOW PLAYING</div>
      <Turntable
        isPlaying={isPlaying}
        labelColor={track?.labelColor}
        trackProgress={progress}
        playerStatus={playerStatus}
      />
      <div className={styles.nowPlayingWrap}>
        <NowPlaying
          onUpdateMetadata={onUpdateMetadata}
          onMoveTrack={onMoveTrack}
        />
      </div>
      <div className={styles.progressWrap}>
        <ProgressBar onSeek={onSeek} />
      </div>
      <div className={styles.controlsWrap}>
        <Controls onTogglePlay={onTogglePlay} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className={styles.deckWrap}>
        <TapeDeck />
      </div>
    </div>
  );
}
