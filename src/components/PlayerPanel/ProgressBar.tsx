import { usePlayerStore } from '../../store/playerStore';
import styles from './ProgressBar.module.css';

interface Props {
  onSeek?: (posMs: number) => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function ProgressBar({ onSeek }: Props) {
  const { progress, currentTime, tracks, currentIndex } = usePlayerStore();
  const track = tracks[currentIndex];

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!track || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(Math.round(pct * track.duration * 1000));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.track} onClick={handleClick}>
        <div className={styles.fill} style={{ width: `${progress * 100}%` }} />
        <div className={styles.head} style={{ marginLeft: `${progress * 100}%` }} />
      </div>
      <div className={styles.times}>
        <span>{fmt(currentTime)}</span>
        <span>{fmt(track?.duration ?? 0)}</span>
      </div>
    </div>
  );
}
