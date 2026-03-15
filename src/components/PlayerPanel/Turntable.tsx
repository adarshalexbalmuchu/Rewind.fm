import styles from './Turntable.module.css';

interface Props {
  isPlaying: boolean;
  labelColor?: string;
  trackProgress?: number;
  playerStatus: 'disconnected' | 'no_premium' | 'initializing' | 'ready';
}

export function Turntable({ isPlaying, labelColor = '#cc1808', trackProgress = 0, playerStatus }: Props) {
  const shouldSpin = isPlaying && playerStatus === 'ready';
  const armRotation = -20 + Math.min(1, Math.max(0, trackProgress)) * 25;
  const grooveRings = Array.from({ length: 20 }, (_, idx) => 114 - idx * 4.35);

  return (
    <svg
      viewBox="0 0 360 360"
      width="320"
      height="320"
      style={{ width: 'min(90vw, 340px)', height: 'auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="deckGlow" cx="42%" cy="28%" r="74%">
          <stop offset="0%" stopColor="#2a2115" />
          <stop offset="50%" stopColor="#14100a" />
          <stop offset="100%" stopColor="#070604" />
        </radialGradient>

        <radialGradient id="platterGrad" cx="43%" cy="36%" r="60%">
          <stop offset="0%" stopColor="#2b2418" />
          <stop offset="68%" stopColor="#0f0d09" />
          <stop offset="100%" stopColor="#060504" />
        </radialGradient>

        <radialGradient id="vinylGrad" cx="56%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#221d15" />
          <stop offset="42%" stopColor="#0f0d0a" />
          <stop offset="100%" stopColor="#020202" />
        </radialGradient>

        <radialGradient id="labelGrad" cx="40%" cy="36%" r="60%">
          <stop offset="0%" stopColor="#ff9f9a" />
          <stop offset="20%" stopColor="#ff5f56" />
          <stop offset="66%" stopColor={labelColor} />
          <stop offset="100%" stopColor="#6d0404" />
        </radialGradient>

        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d089" />
          <stop offset="36%" stopColor="#c89a44" />
          <stop offset="100%" stopColor="#6f4d14" />
        </linearGradient>

        <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7db9d" />
          <stop offset="50%" stopColor="#b78b3f" />
          <stop offset="100%" stopColor="#5f4210" />
        </linearGradient>

        <linearGradient id="shadowFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodColor="#000000" floodOpacity="0.58" />
        </filter>

        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <rect x="22" y="22" width="316" height="316" rx="16" fill="url(#deckGlow)" stroke="#2a2115" strokeWidth="1.8" />
      <rect x="28" y="28" width="304" height="304" rx="12" fill="#050505" />
      <circle cx="62" cy="62" r="22" fill="#18130e" stroke="#3b2d1a" strokeWidth="1.3" />
      <path d="M62 46 L62 62 L72 56" stroke="#f2d38d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="84" cy="76" r="2.3" fill="#090909" stroke="#3f2d1d" strokeWidth="0.8" />
      <circle cx="52" cy="86" r="1.8" fill="#0b0b0b" stroke="#3f2d1d" strokeWidth="0.6" />
      <circle cx="48" cy="100" r="1.6" fill="#0b0b0b" stroke="#3f2d1d" strokeWidth="0.6" />

      <rect x="46" y="285" width="40" height="10" rx="2.4" fill="#7b6332" stroke="#dac07f" strokeWidth="0.8" />
      <rect x="95" y="285" width="40" height="10" rx="2.4" fill="#7b6332" stroke="#dac07f" strokeWidth="0.8" />
      <rect x="301" y="224" width="14" height="74" rx="2.2" fill="#403325" stroke="#7f6332" strokeWidth="1" />
      <line x1="308" y1="236" x2="308" y2="289" stroke="#a2824a" strokeWidth="1.1" opacity="0.65" />
      <rect x="304" y="252" width="8" height="18" rx="1.2" fill="#9e7a41" stroke="#d5b56f" strokeWidth="0.7" />
      <circle cx="262" cy="305" r="4.3" fill="#ece1ca" />

      <circle cx="178" cy="176" r="132" fill="url(#platterGrad)" filter="url(#shadow)" />
      <circle cx="178" cy="176" r="130" fill="none" stroke="#b48c3f" strokeWidth="1.2" />
      <circle cx="178" cy="176" r="126" fill="none" stroke="#362914" strokeWidth="1.5" />

      <circle cx="178" cy="176" r="118" fill="url(#vinylGrad)" />
      <ellipse cx="148" cy="120" rx="78" ry="52" fill="url(#shadowFade)" opacity="0.36" filter="url(#soft)" />

      {grooveRings.map((r, i) => (
        <circle key={i} cx="178" cy="176" r={r} fill="none" stroke="#2a2218" strokeWidth="0.9" opacity="0.54" />
      ))}

      <g
        id="vinyl-label-group"
        className={styles.vinylLabel}
        style={{
          transformOrigin: '178px 176px',
          animation: 'recspin 2.6s linear infinite',
          animationPlayState: shouldSpin ? 'running' : 'paused',
          animationDuration: playerStatus === 'initializing' ? '5s' : '2.6s',
        }}
      >
        <circle cx="178" cy="176" r="41" fill="url(#labelGrad)" />
        <circle cx="178" cy="176" r="38" fill="none" stroke="#5b110f" strokeWidth="1.1" opacity="0.5" />
        <circle cx="178" cy="176" r="35" fill="none" stroke="#ffb2ac" strokeWidth="0.7" opacity="0.25" />

        <path d="M160 190 C173 197, 188 198, 202 191" stroke="#ffd8ce" strokeWidth="1.2" opacity="0.26" fill="none" />
        <path d="M164 196 C174 201, 186 201, 196 197" stroke="#ffd8ce" strokeWidth="0.9" opacity="0.2" fill="none" />

        <circle cx="178" cy="176" r="5.1" fill="#f9dcc0" />
        <circle cx="178" cy="176" r="2.2" fill="#37190c" />
      </g>

      <g transform={`rotate(${armRotation} 284 84)`}>
        <circle cx="284" cy="84" r="33" fill="#17120c" stroke="#4a3416" strokeWidth="1.8" />
        <circle cx="284" cy="84" r="23" fill="#0b0907" stroke="#84612a" strokeWidth="1.2" />
        <circle cx="284" cy="84" r="13" fill="#17120c" stroke="url(#metalGrad)" strokeWidth="1" />
        <circle cx="284" cy="84" r="3.1" fill="#f0cf8c" />

        <circle cx="308" cy="58" r="11" fill="#251c12" stroke="#7f5f2b" strokeWidth="1" />
        <circle cx="308" cy="58" r="7.2" fill="#ba8f4a" stroke="#f3d395" strokeWidth="0.8" />

        <path d="M284 84 C274 98, 256 126, 238 158" stroke="url(#armGrad)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M238 158 C227 176, 217 194, 206 211" stroke="url(#armGrad)" strokeWidth="5.6" fill="none" strokeLinecap="round" />
        <line x1="272" y1="98" x2="281" y2="82" stroke="#f0d496" strokeWidth="1.7" strokeLinecap="round" opacity="0.78" />

        <rect x="196" y="210" width="28" height="12" rx="2" fill="#9d7533" stroke="#e2c181" strokeWidth="0.9" transform="rotate(-33 210 216)" />
        <line x1="193" y1="224" x2="203" y2="214" stroke="#e2c181" strokeWidth="1" />
        <circle cx="192" cy="223" r="2" fill="#f5dbb0" />
      </g>

      <circle cx="286" cy="306" r="4.5" fill={isPlaying ? '#5ed46d' : '#15120c'} />
      <circle cx="286" cy="306" r="2" fill={isPlaying ? '#a6ffc0' : '#2a2115'} />
    </svg>
  );
}
