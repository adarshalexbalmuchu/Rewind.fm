import styles from './Turntable.module.css';

interface Props {
  isPlaying: boolean;
  labelColor?: string;
  trackProgress?: number;
  playerStatus: 'disconnected' | 'no_premium' | 'initializing' | 'ready';
}

export function Turntable({ isPlaying, labelColor = '#cc1808', trackProgress = 0, playerStatus }: Props) {
  const shouldSpin = isPlaying && playerStatus === 'ready';
  const armRotation = -18 + Math.min(1, Math.max(0, trackProgress)) * 30;
  const grooveRings = Array.from({ length: 18 }, (_, idx) => 93 - idx * 3.8);

  return (
    <svg
      viewBox="0 0 280 280"
      width="256"
      height="256"
      style={{ width: 'min(80vw, 256px)', height: 'auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2a2010" />
          <stop offset="100%" stopColor="#0e0b07" />
        </radialGradient>
        <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1610" />
          <stop offset="60%" stopColor="#0e0b07" />
          <stop offset="100%" stopColor="#1a1610" />
        </radialGradient>
        <radialGradient id="labelGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff5040" />
          <stop offset="60%" stopColor={labelColor} />
          <stop offset="100%" stopColor="#7a0000" />
        </radialGradient>
        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#daa820" />
          <stop offset="100%" stopColor="#a07808" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect x="20" y="20" width="240" height="240" rx="16" fill="#1e1810" stroke="#2a2218" strokeWidth="1.5" />
      <rect x="26" y="26" width="228" height="228" rx="13" fill="#161209" />

      <circle cx="140" cy="140" r="110" fill="url(#platterGrad)" filter="url(#shadow)" />
      <circle cx="140" cy="140" r="108" fill="none" stroke="#c89010" strokeWidth="1.5" />

      <circle cx="140" cy="140" r="100" fill="url(#vinylGrad)" />

      {grooveRings.map((r, i) => (
        <circle key={i} cx="140" cy="140" r={r} fill="none" stroke="#2a2218" strokeWidth="0.7" opacity="0.45" />
      ))}

      <g
        id="vinyl-label-group"
        className={styles.vinylLabel}
        style={{
          transformOrigin: '140px 140px',
          animation: 'recspin 2.6s linear infinite',
          animationPlayState: shouldSpin ? 'running' : 'paused',
          animationDuration: playerStatus === 'initializing' ? '5s' : '2.6s',
        }}
      >
        <circle cx="140" cy="140" r="46" fill="url(#labelGrad)" />
        <circle cx="140" cy="140" r="42" fill="none" stroke="#1a0a08" strokeWidth="1.2" opacity="0.5" />

        <rect x="108" y="122" width="64" height="3" rx="1.5" fill="#1a0a08" opacity="0.4" />
        <rect x="114" y="130" width="52" height="2" rx="1" fill="#1a0a08" opacity="0.3" />
        <rect x="119" y="136" width="42" height="2" rx="1" fill="#1a0a08" opacity="0.22" />
        <rect x="114" y="142" width="52" height="2" rx="1" fill="#1a0a08" opacity="0.3" />
        <rect x="108" y="149" width="64" height="3" rx="1.5" fill="#1a0a08" opacity="0.4" />

        <circle cx="140" cy="140" r="4.5" fill="#0e0b07" />
        <circle cx="140" cy="140" r="3" fill="#2a2218" />
      </g>

      <g transform={`rotate(${armRotation} 228 52)`}>
        <circle cx="228" cy="52" r="12" fill="#2a2218" stroke="#8a6a18" strokeWidth="1.2" />
        <circle cx="228" cy="52" r="7" fill="#1a1610" stroke="#a07808" strokeWidth="1" />
        <circle cx="228" cy="52" r="2" fill="#c8940a" />

        <path d="M228 52 C214 70, 192 96, 174 119" stroke="url(#armGrad)" strokeWidth="4.2" fill="none" strokeLinecap="round" />
        <line x1="214" y1="58" x2="222" y2="44" stroke="#a07808" strokeWidth="2" strokeLinecap="round" />
        <circle cx="232" cy="38" r="4" fill="#a07808" />
        <rect x="161" y="118" width="17" height="9" rx="2" fill="#c8940a" stroke="#8a6a18" strokeWidth="1" transform="rotate(-24 169.5 122.5)" />
        <circle cx="160" cy="128" r="1.8" fill="#ede0bb" />
      </g>

      <rect x="28" y="228" width="224" height="24" rx="5" fill="#1a140d" stroke="#2a2218" strokeWidth="1" />
      <rect x="34" y="234" width="16" height="8" rx="3" fill="#2a2218" stroke="#a07808" strokeWidth="0.9" />
      <rect x="54" y="234" width="16" height="8" rx="3" fill="#2a2218" stroke="#a07808" strokeWidth="0.9" />
      <circle cx="84" cy="238" r="2" fill="#e02818" />
      <circle cx="92" cy="238" r="2" fill="#f07810" />
      <circle cx="100" cy="238" r="2" fill="#f4c010" />
      <line x1="122" y1="238" x2="168" y2="238" stroke="#a07808" strokeWidth="1.4" />
      <rect x="142" y="233" width="6" height="10" rx="2" fill="#c8940a" />
      <circle cx="220" cy="238" r="6" fill="#2a2218" stroke="#a07808" strokeWidth="1" />
      <circle cx="220" cy="238" r="2" fill="#c8940a" />

      <circle cx="244" cy="240" r="4" fill={isPlaying ? '#2aaa30' : '#1a1610'} />
      <circle cx="244" cy="240" r="2" fill={isPlaying ? '#60e060' : '#2a2218'} />
    </svg>
  );
}
