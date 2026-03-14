import { usePlayerStore } from '../../store/playerStore';
import styles from './TapeDeck.module.css';

export function TapeDeck() {
  const { currentTime, isPlaying } = usePlayerStore();
  const spinState = isPlaying ? 'running' : 'paused';

  function fmtDeck(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `T-120 · SIDE A · 00:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div className={styles.deck}>
      <div className={styles.body}>
        <div className={styles.reel} style={{ animationPlayState: spinState }} />
        <div className={styles.tapePath}>
          <div className={styles.tapeLine} />
          <div className={styles.tapeLine} />
        </div>
        <div className={styles.reel} style={{ animationPlayState: spinState }} />
      </div>
      <div className={styles.label}>{fmtDeck(currentTime)}</div>
    </div>
  );
}
