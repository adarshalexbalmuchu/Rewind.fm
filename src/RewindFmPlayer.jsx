/*
Design decisions summary:
- Fixed the core animation bug by splitting the hero into a static turntable base image and a separate spinning vinyl overlay.
- Reworked the screen into a luxury retro hi-fi style using warm black surfaces, muted gold hierarchy, and restrained crimson play accents.
- Removed rainbow usage from transport/volume and limited stripe colors to the active station chip accent only.
- Improved typography rhythm and spacing: serif-led title focus, condensed artist contrast, and mono metadata for broadcast-like utility.
- Kept both progress and volume sliders pointer-draggable while refining controls, micro-interactions, and mini-player density for mobile.
*/

import { useEffect, useMemo, useRef, useState } from 'react';

const TRACK_DURATION = 245;
const SEEK_STEP = 10;
const CURVE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(sec / 60);
  const remain = sec % 60;
  return `${String(min)}:${String(remain).padStart(2, '0')}`;
}

function IconSignal() {
  return (
    <svg viewBox="0 0 28 20" aria-hidden="true">
      <rect x="1" y="12" width="5" height="7" rx="1.2" fill="currentColor" />
      <rect x="9" y="8" width="5" height="11" rx="1.2" fill="currentColor" />
      <rect x="17" y="3" width="5" height="16" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="4" y="6" width="2.8" height="16" rx="1" fill="currentColor" />
      <polygon points="22,6 8.5,14 22,22" fill="currentColor" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="21.2" y="6" width="2.8" height="16" rx="1" fill="currentColor" />
      <polygon points="6,6 19.5,14 6,22" fill="currentColor" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M16 8L9 14L16 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 8L15 14L22 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconForward() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M12 8L19 14L12 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8L13 14L6 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <polygon points="10,7 22,14 10,21" fill="currentColor" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="9" y="7" width="4" height="14" rx="1.1" fill="currentColor" />
      <rect x="16" y="7" width="4" height="14" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 23s-7.2-4.5-9.3-8.8c-1.6-3.4-.1-6.6 3.2-7.1 2-.3 3.8.6 5.1 2.3 1.2-1.7 3.1-2.6 5-2.3 3.4.5 4.9 3.7 3.3 7.1C21.2 18.5 14 23 14 23z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M4 8h4.2c2.7 0 4.5 1.3 6.4 4.1l2.2 3.2c1.2 1.8 2.2 3.7 5 3.7H24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 5h4v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 20h4.6c2.6 0 4-1.1 5.4-3.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 23h4v-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 6-6h8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 4l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M22 18a6 6 0 0 1-6 6H8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 24l-3-3 3-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconSpeaker() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M5 12h5l6-5v14l-6-5H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19 11c1.2 1 1.9 2 1.9 3s-.7 2-1.9 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21.8 8.8c2 1.6 3.2 3.3 3.2 5.2s-1.2 3.6-3.2 5.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RewindFmPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(86);
  const [volume, setVolume] = useState(0.72);
  const [activeStation, setActiveStation] = useState('100.4 FM');
  const [tappedChip, setTappedChip] = useState('');
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  const stations = useMemo(
    () => ['100.4 FM', '102.1 MHz', 'FM Gold', 'Retro 80s', 'Jazz FM'],
    []
  );

  useEffect(() => {
    if (!isPlaying || isDraggingProgress) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsed((prev) => (prev + 1 > TRACK_DURATION ? 0 : prev + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, isDraggingProgress]);

  useEffect(() => {
    function onPointerMove(event) {
      if (isDraggingProgress) {
        setProgressFromPointer(event.clientX);
      }
      if (isDraggingVolume) {
        setVolumeFromPointer(event.clientX);
      }
    }

    function onPointerUp() {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    }

    if (isDraggingProgress || isDraggingVolume) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingProgress, isDraggingVolume]);

  const progressRatio = clamp(elapsed / TRACK_DURATION, 0, 1);

  function setProgressFromPointer(clientX) {
    if (!progressRef.current) {
      return;
    }
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    setElapsed(Math.round(ratio * TRACK_DURATION));
  }

  function setVolumeFromPointer(clientX) {
    if (!volumeRef.current) {
      return;
    }
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    setVolume(ratio);
  }

  function onProgressPointerDown(event) {
    event.preventDefault();
    setIsDraggingProgress(true);
    setProgressFromPointer(event.clientX);
  }

  function onVolumePointerDown(event) {
    event.preventDefault();
    setIsDraggingVolume(true);
    setVolumeFromPointer(event.clientX);
  }

  function seekBy(delta) {
    setElapsed((prev) => clamp(prev + delta, 0, TRACK_DURATION));
  }

  function handleChipTap(station) {
    setActiveStation(station);
    setTappedChip(station);
    window.setTimeout(() => setTappedChip(''), 180);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --bg-primary: #0D0C0A;
          --bg-secondary: #161410;
          --bg-card: #1C1A16;
          --gold: #C9A84C;
          --gold-dim: #8A6F30;
          --crimson: #C0392B;
          --text-primary: #F0EAD6;
          --text-secondary: #7A7060;
          --text-muted: #4A4540;
          --stripe-colors: #F5C518, #F07D00, #E63950, #9B59B6, #27AE60, #16A085, #2980B9;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--bg-primary);
        }

        .rewind-stage {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: stretch;
          background: #000;
        }

        .rewind-phone {
          width: 390px;
          min-height: 844px;
          background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary));
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 0 0 150px;
        }

        .rewind-phone::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px 11px;
          border-bottom: 1px solid rgba(201, 168, 76, 0.1);
          animation: logoDrop 0.6s ${CURVE} both;
          position: relative;
          z-index: 2;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          height: 28px;
          width: auto;
          display: block;
          object-fit: contain;
        }

        .freq {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .signal {
          color: var(--gold);
          width: 28px;
          height: 20px;
        }

        .hero {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          margin: 0;
          animation: deckScale 0.6s ease-out both;
        }

        .hero-stack {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .turntable-base {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0;
          display: block;
        }

        .vinyl-overlay {
          position: absolute;
          top: 9.8%;
          left: 9.5%;
          width: 76%;
          height: 76%;
          border-radius: 50%;
          transform-origin: center;
          background:
            radial-gradient(circle at 50% 50%, #C0392B 0 26%, #1a1a1a 26.5% 27.5%, #0f0f0f 28% 100%);
          box-shadow: none;
          transition: box-shadow 0.5s ${CURVE};
          pointer-events: none;
        }

        .vinyl-overlay.playing {
          box-shadow: 0 0 30px rgba(192, 57, 43, 0.6);
        }

        .hero-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 60%, #0D0C0A 100%);
          pointer-events: none;
        }

        .track-meta {
          padding: 20px 24px 0;
          border-left: 3px solid var(--gold);
          margin: 0 0 0 24px;
          padding-left: 16px;
        }

        .track-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          line-height: 1.1;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: 0.01em;
        }

        .track-artist {
          margin-top: 9px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: var(--gold);
        }

        .track-album {
          margin-top: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }

        .scrub {
          padding: 18px 24px 0;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: 7px;
          border-radius: 999px;
          background: #2A2520;
          cursor: pointer;
          touch-action: none;
        }

        .slider-fill {
          position: absolute;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(to right, var(--gold-dim), var(--gold));
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: var(--gold);
          box-shadow: 0 0 12px rgba(201, 168, 76, 0.45);
        }

        .slider-thumb::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #fff;
          opacity: 0.92;
        }

        .time-row {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .controls {
          display: flex;
          justify-content: space-evenly;
          align-items: center;
          padding: 16px 18px 6px;
          opacity: 0;
          animation: controlsFade 0.4s ${CURVE} 0.4s forwards;
        }

        .ctrl-btn,
        .mini-toggle,
        .util-btn,
        .chip {
          transition: all 0.2s ${CURVE};
        }

        .ctrl-btn,
        .util-btn,
        .mini-toggle {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .ctrl-btn:hover,
        .util-btn:hover,
        .mini-toggle:hover,
        .chip:hover {
          opacity: 0.8;
        }

        .ctrl-btn:active,
        .util-btn:active,
        .mini-toggle:active,
        .chip:active {
          transform: scale(0.94);
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--text-secondary);
        }

        .icon-btn:hover {
          color: var(--gold);
        }

        .icon-btn svg {
          width: 20px;
          height: 20px;
        }

        .step-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 48px;
          gap: 2px;
          color: var(--text-secondary);
        }

        .step-btn svg {
          width: 22px;
          height: 22px;
        }

        .step-btn span {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          line-height: 1;
        }

        .play-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid var(--gold);
          background: #1C1A16;
          color: var(--gold);
          display: grid;
          place-items: center;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .play-btn svg {
          width: 28px;
          height: 28px;
        }

        .play-btn.active {
          background: var(--crimson);
          color: #F8F0E6;
          box-shadow: 0 0 0 6px rgba(201, 168, 76, 0.15), 0 0 20px rgba(192, 57, 43, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.25);
        }

        .utility-icons {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding-top: 10px;
        }

        .util-btn {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          color: var(--text-secondary);
        }

        .util-btn svg {
          width: 22px;
          height: 22px;
        }

        .volume-row {
          display: grid;
          grid-template-columns: 22px 1fr;
          align-items: center;
          gap: 10px;
          padding: 10px 24px 0;
        }

        .speaker {
          color: var(--text-secondary);
          width: 22px;
          height: 22px;
        }

        .station-row {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 90px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 14px 4px;
          scrollbar-width: none;
        }

        .station-row::-webkit-scrollbar {
          display: none;
        }

        .chip {
          position: relative;
          border-radius: 999px;
          padding: 8px 18px;
          border: 1px solid #2A2520;
          background: #1C1A16;
          color: var(--text-secondary);
          white-space: nowrap;
          text-transform: uppercase;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .chip.active {
          background: transparent;
          border-color: var(--gold);
          color: var(--gold);
        }

        .chip.active::after {
          content: '';
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: -1px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--stripe-colors));
        }

        .chip.tapped {
          transform: scale(1.05);
        }

        .mini-player {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 72px;
          border-top: 1px solid rgba(201, 168, 76, 0.15);
          background: #161410;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
        }

        .mini-vinyl {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid var(--gold);
          flex-shrink: 0;
        }

        .mini-vinyl img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: spin 3s linear infinite;
          animation-play-state: running;
        }

        .mini-vinyl img.paused {
          animation-play-state: paused;
        }

        .mini-copy {
          min-width: 0;
          flex: 1;
        }

        .mini-title {
          font-family: 'DM Serif Display', serif;
          font-size: 14px;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .mini-artist {
          margin-top: 3px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .mini-toggle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid var(--gold);
          background: var(--crimson);
          color: #F8EEE2;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .mini-toggle svg {
          width: 20px;
          height: 20px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes logoDrop {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes deckScale {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes controlsFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 420px) {
          .rewind-phone {
            width: 100vw;
            min-height: 100vh;
          }
        }
      `}</style>

      <div className="rewind-stage">
        <main className="rewind-phone">
          <header className="topbar">
            <div className="topbar-left">
              <img className="logo" src="/logo back.png" alt="Rewind.fm logo" />
              <div className="freq">100.4 MHz</div>
            </div>
            <div className="signal" aria-label="Signal strength">
              <IconSignal />
            </div>
          </header>

          <section className="hero" aria-label="Now playing turntable">
            <div className="hero-stack" style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
              <img
                src="/Player.png"
                alt="Turntable player"
                className="turntable-base"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0' }}
              />
              <div
                className={`vinyl-overlay ${isPlaying ? 'playing' : ''}`}
                style={{
                  position: 'absolute',
                  top: '9.8%',
                  left: '9.5%',
                  width: '76%',
                  height: '76%',
                  borderRadius: '50%',
                  animation: isPlaying ? 'spin 3s linear infinite' : 'spin 3s linear infinite paused',
                  background: 'radial-gradient(circle at 50% 50%, #C0392B 28%, #1a1a1a 28.5%, #111 100%)',
                  boxShadow: isPlaying ? '0 0 30px rgba(192,57,43,0.6)' : 'none',
                  transition: 'box-shadow 0.5s ease',
                }}
              />
              <div className="hero-fade" />
            </div>
          </section>

          <section className="track-meta">
            <h1 className="track-title">Midnight Frequency</h1>
            <div className="track-artist">REWIND RESIDENTS</div>
            <div className="track-album">UKW SESSION VOL. 4</div>
          </section>

          <section className="scrub" aria-label="Track progress">
            <div className="slider-track" ref={progressRef} onPointerDown={onProgressPointerDown}>
              <div className="slider-fill" style={{ width: `${progressRatio * 100}%` }} />
              <div className="slider-thumb" style={{ left: `${progressRatio * 100}%` }} />
            </div>
            <div className="time-row">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(TRACK_DURATION)}</span>
            </div>
          </section>

          <section className="controls" aria-label="Playback controls">
            <button className="ctrl-btn icon-btn" aria-label="Previous track" type="button">
              <IconPrev />
            </button>

            <button className="ctrl-btn step-btn" aria-label="Rewind 10 seconds" type="button" onClick={() => seekBy(-SEEK_STEP)}>
              <IconBack />
              <span>10</span>
            </button>

            <button
              className={`ctrl-btn play-btn ${isPlaying ? 'active' : ''}`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button className="ctrl-btn step-btn" aria-label="Forward 10 seconds" type="button" onClick={() => seekBy(SEEK_STEP)}>
              <IconForward />
              <span>10</span>
            </button>

            <button className="ctrl-btn icon-btn" aria-label="Next track" type="button">
              <IconNext />
            </button>
          </section>

          <section className="utility-icons" aria-label="Utility controls">
            <button className="util-btn" aria-label="Like" type="button">
              <IconHeart />
            </button>
            <button className="util-btn" aria-label="Shuffle" type="button">
              <IconShuffle />
            </button>
            <button className="util-btn" aria-label="Repeat" type="button">
              <IconRepeat />
            </button>
          </section>

          <section className="volume-row" aria-label="Volume controls">
            <div className="speaker" aria-hidden="true">
              <IconSpeaker />
            </div>
            <div className="slider-track" ref={volumeRef} onPointerDown={onVolumePointerDown}>
              <div className="slider-fill" style={{ width: `${volume * 100}%` }} />
              <div className="slider-thumb" style={{ left: `${volume * 100}%` }} />
            </div>
          </section>

          <section className="station-row" aria-label="Station chips">
            {stations.map((station) => (
              <button
                key={station}
                type="button"
                className={`chip ${activeStation === station ? 'active' : ''} ${tappedChip === station ? 'tapped' : ''}`}
                onClick={() => handleChipTap(station)}
              >
                {station}
              </button>
            ))}
          </section>

          <section className="mini-player" aria-label="Mini player">
            <div className="mini-vinyl" aria-hidden="true">
              <img src="/Player.png" alt="" className={isPlaying ? '' : 'paused'} />
            </div>
            <div className="mini-copy">
              <div className="mini-title">Midnight Frequency</div>
              <div className="mini-artist">REWIND RESIDENTS</div>
            </div>
            <button
              type="button"
              className="mini-toggle"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
          </section>
        </main>
      </div>
    </>
  );
}
