import { useEffect, useState } from 'react';
import { CassetteCard } from './CassetteCard';
import { usePlayerStore, type Track } from '../../store/playerStore';
import styles from './TapeLibrary.module.css';

interface Props {
  isLoading: boolean;
  onSelectCassette?: (index: number) => void;
  onMoveTrack?: (trackId: string, dir: -1 | 1) => void;
  recentlyRewound?: Track[];
  shelves?: string[];
  newShelfName?: string;
  onNewShelfNameChange?: (value: string) => void;
  onCreateShelf?: () => void;
  onRenameShelf?: (oldName: string, newName: string) => void;
  onDeleteShelf?: (name: string) => void;
  onExportCollection?: () => void;
  onImportCollection?: (jsonText: string) => void;
  onReorderTracks?: (fromId: string, toId: string) => void;
  collectionNotice?: { tone: 'ok' | 'error'; text: string } | null;
}

export function TapeLibrary({
  isLoading,
  onSelectCassette,
  onMoveTrack,
  recentlyRewound: _recentlyRewound = [],
  shelves: _shelves = [],
  newShelfName: _newShelfName = '',
  onNewShelfNameChange: _onNewShelfNameChange,
  onCreateShelf: _onCreateShelf,
  onRenameShelf: _onRenameShelf,
  onDeleteShelf: _onDeleteShelf,
  onExportCollection: _onExportCollection,
  onImportCollection: _onImportCollection,
  onReorderTracks,
  collectionNotice: _collectionNotice,
}: Props) {
  const {
    tracks,
    currentIndex,
    isPlaying,
    setCurrentIndex,
    setIsPlaying,
    setCurrentTime,
    setProgress,
    playerStatus,
    isDemoMode,
  } = usePlayerStore();

  const showSkeletons = isLoading || playerStatus === 'initializing';
  const [isTouchLike, setIsTouchLike] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const songEntries = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => track.itemType !== 'playlist');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const touchMedia = window.matchMedia('(pointer: coarse)');
    const updateTouchMode = () => setIsTouchLike(touchMedia.matches);
    updateTouchMode();
    touchMedia.addEventListener('change', updateTouchMode);
    return () => touchMedia.removeEventListener('change', updateTouchMode);
  }, []);

  function handleSelect(index: number) {
    if (index === currentIndex) {
      return;
    }

    setCurrentIndex(index);
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(true);

    if (isPlaying && onSelectCassette) {
      onSelectCassette(index);
    }
  }

  function handleDropOnTrack(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      return;
    }
    onReorderTracks?.(draggingId, targetId);
    setDraggingId(null);
  }

  function renderCassette(track: Track, index: number) {
    const songOrder = songEntries.map(({ track: songTrack }) => songTrack.id);
    const orderIndex = songOrder.indexOf(track.id);
    const canMoveUp = orderIndex > 0;
    const canMoveDown = orderIndex >= 0 && orderIndex < songOrder.length - 1;

    return (
      <div key={track.id} className={styles.songItemWrap}>
        <CassetteCard
          title={track.title}
          artist={track.artist}
          cassetteStyle={track.cassetteStyle}
          coverImage={track.coverImage}
          isUnavailable={!!track.unavailable}
          isSelected={index === currentIndex}
          onClick={() => handleSelect(index)}
          draggable={!isTouchLike}
          onDragStart={() => setDraggingId(track.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnTrack(track.id)}
          onDragEnd={() => setDraggingId(null)}
        />
        <div className={styles.mobileReorderRow}>
          <button
            className={styles.mobileReorderBtn}
            onClick={() => onMoveTrack?.(track.id, -1)}
            disabled={!canMoveUp}
            aria-label={`Move ${track.title} up`}
          >
            UP
          </button>
          <button
            className={styles.mobileReorderBtn}
            onClick={() => onMoveTrack?.(track.id, 1)}
            disabled={!canMoveDown}
            aria-label={`Move ${track.title} down`}
          >
            DOWN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.library}>
      <div className={styles.head}>
        <div className={styles.label}>TAPE RACK</div>
        {isDemoMode && <div className={styles.demoBadge}>DEMO</div>}
      </div>

      {showSkeletons
        ? Array.from({ length: 5 }).map((_, i) => (
          <CassetteCard
            key={i}
            title=""
            artist=""
            cassetteStyle="yellow-black"
            isSelected={false}
            onClick={() => {}}
            isLoading
          />
        ))
        : (
          <>
            {songEntries.map(({ track, index }) => renderCassette(track, index))}
            {songEntries.length === 0 && (
              <div className={styles.emptyState}>No tapes yet.</div>
            )}
          </>
        )}
    </div>
  );
}
