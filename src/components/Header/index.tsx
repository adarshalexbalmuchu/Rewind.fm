import { usePlayerStore } from '../../store/playerStore';
import styles from './Header.module.css';

interface Props {
  isConnected: boolean;
  onConnect: () => void;
}

export function Header({ isConnected, onConnect }: Props) {
  const { currentTime } = usePlayerStore();

  function fmtVHS(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 30);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoMain}>RE</span>
          <span className={styles.logoW}>W</span>
          <span className={styles.logoMain}>IND</span>
          <span className={styles.logoDot}>.</span>
          <span className={styles.logoFm}>FM</span>
        </div>
        <div className={styles.meta}>
          <div className={styles.metaLine}>TAPES</div>
          <div className={styles.dots}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={styles.dot}
                style={{
                  background:
                    i < 4
                      ? i < 2
                        ? '#e02818'
                        : i === 2
                        ? '#f07810'
                        : '#f4c010'
                      : '#2a2218',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.vcounter}>{fmtVHS(currentTime)}</div>
        <button
          className={`${styles.spBtn} ${isConnected ? styles.connected : ''}`}
          onClick={onConnect}
          disabled={isConnected}
        >
          {isConnected ? 'SPOTIFY' : 'CONNECT'}
        </button>
      </div>
    </header>
  );
}
