import { usePlayerStore } from '../../store/playerStore';
import styles from './StatusOverlay.module.css';

export function StatusOverlay() {
  const { playerStatus } = usePlayerStore();

  const statusConfig = {
    disconnected: {
      text: 'INSERT TAPE TO BEGIN',
      sub: null,
      dim: true,
    },
    no_premium: {
      text: 'PREMIUM REQUIRED',
      sub: 'PLAYBACK UNAVAILABLE - UI DEMO MODE ACTIVE',
      dim: false,
    },
    initializing: {
      text: 'INITIALIZING DECK...',
      sub: null,
      dim: false,
    },
    ready: null,
  } as const;

  const current = statusConfig[playerStatus];
  if (!current) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.overlay}>
        <div>{current.text}</div>
        {current.sub && <div className={styles['overlay-sub']}>{current.sub}</div>}
      </div>
    </div>
  );
}
