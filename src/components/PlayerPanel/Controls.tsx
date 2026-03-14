import { usePlayerStore } from '../../store/playerStore';
import styles from './Controls.module.css';

interface Props {
  onTogglePlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Controls({ onTogglePlay, onPrev, onNext }: Props) {
  const { isPlaying, skipTrack, setIsPlaying } = usePlayerStore();

  function handleToggle() {
    if (onTogglePlay) onTogglePlay();
    else setIsPlaying(!isPlaying);
  }

  function handlePrev() {
    if (onPrev) onPrev();
    else skipTrack(-1);
  }

  function handleNext() {
    if (onNext) onNext();
    else skipTrack(1);
  }

  return (
    <div className={styles.ctrl}>
      <button className={styles.btn} onClick={handlePrev}>◀◀</button>
      <button className={`${styles.btn} ${styles.play}`} onClick={handleToggle}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button className={styles.btn} onClick={handleNext}>▶▶</button>
    </div>
  );
}
