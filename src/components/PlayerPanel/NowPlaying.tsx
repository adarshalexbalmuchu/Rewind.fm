import { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import styles from './NowPlaying.module.css';

interface Props {
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
}

export function NowPlaying({ onUpdateMetadata, onMoveTrack: _onMoveTrack }: Props) {
  const { tracks, currentIndex } = usePlayerStore();
  const track = tracks[currentIndex];
  const [isEditing, setIsEditing] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const memoryId = `memory-${track?.id ?? 'none'}`;

  useEffect(() => {
    setMemoryNote(track?.memoryNote ?? '');
    setIsEditing(false);
  }, [track?.id]);

  if (!track) return null;
  const isEditableTrack = track.itemType === 'track';

  function handleSave() {
    if (!track?.id || !onUpdateMetadata) {
      return;
    }

    onUpdateMetadata(track.id, {
      moodTag: track.moodTag ?? '',
      memoryNote: memoryNote.trim(),
      shelfName: track.shelfName ?? 'Memory Cassettes',
      cassetteTheme: track.cassetteTheme ?? 'classic',
      pinned: !!track.pinned,
      archived: !!track.archived,
      unavailable: !!track.unavailable,
      unavailableNote: track.unavailableNote ?? '',
    });
    setIsEditing(false);
  }

  return (
    <div className={styles.info}>
      <div className={styles.title}>{track.title}</div>
      <div className={styles.artist}>{track.artist} · {track.yearLabel ?? track.year}</div>
      {track.unavailable && (
        <div className={styles.unavailable} role="status" aria-live="polite">
          Unavailable. {track.unavailableNote || 'Try another tape.'}
        </div>
      )}
      <div className={styles.memory} role="status" aria-live="polite">
        {track.memoryNote?.trim() || 'No note.'}
      </div>

      {isEditableTrack && (
        <div className={styles.editorWrap}>
          {!isEditing ? (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
              NOTE
            </button>
          ) : (
            <div className={styles.editor}>
              <label className={styles.fieldLabel} htmlFor={memoryId}>Note</label>
              <textarea id={memoryId} className={styles.memoryField} value={memoryNote} onChange={(e) => setMemoryNote(e.target.value)} />

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={handleSave}>SAVE</button>
                <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>CLOSE</button>
              </div>

              <div className={styles.hint}>Drag to reorder.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
