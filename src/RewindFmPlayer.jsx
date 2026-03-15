/*
Design decisions summary:
- Built as a single self-contained React component with internal <style> block and no external UI library.
- Visual language follows a luxury retro hi-fi look: deep black chassis, warm gold controls, crimson play state, and 7-color stripe accents.
- Typography uses Bebas Neue (headings), DM Serif Display (title), and Space Mono (technical metadata).
- Layout targets a 390x844 mobile viewport centered within black gutters on larger screens.
- Interaction model includes pointer-driven draggable progress and volume sliders, station chip active/tap states, and play/pause-driven motion states.
- Motion system uses a consistent cubic-bezier curve and staged load animations: logo drop, deck scale-up, controls fade-in.
*/

import React, { useEffect, useMemo, useRef, useState } from 'react';

const TRACK_DURATION = 245;
const SEEK_STEP = 10;
const STRIPE_GRADIENT =
  'linear-gradient(90deg, #F5C518 0%, #F07D00 16%, #E63950 32%, #9B59B6 48%, #27AE60 64%, #16A085 80%, #2980B9 100%)';

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
      <rect x="1" y="12" width="5" height="7" rx="1.2" />
      <rect x="9" y="8" width="5" height="11" rx="1.2" />
      <rect x="17" y="3" width="5" height="16" rx="1.2" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="3" y="6" width="3.2" height="16" rx="1.1" />
      <polygon points="22,6 9,14 22,22" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="21.8" y="6" width="3.2" height="16" rx="1.1" />
      <polygon points="6,6 19,14 6,22" />
    </svg>
  );
}

function IconBack10() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 5a9 9 0 1 0 7.6 13.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polygon points="14,3 8.2,8.3 15,9" fill="currentColor" />
      <text x="14" y="18" textAnchor="middle" fontSize="7.5" fontFamily="Space Mono" fill="currentColor">10</text>
    </svg>
  );
}

function IconFwd10() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 5a9 9 0 1 1-7.6 13.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polygon points="14,3 19.8,8.3 13,9" fill="currentColor" />
      <text x="14" y="18" textAnchor="middle" fontSize="7.5" fontFamily="Space Mono" fill="currentColor">10</text>
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <polygon points="10,7 22,14 10,21" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="9" y="7" width="4" height="14" rx="1.1" />
      <rect x="16" y="7" width="4" height="14" rx="1.1" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 23s-7.5-4.7-9.7-9.2C2.6 10 4.3 6.8 7.7 6.3c2-.3 3.8.6 5 2.2 1.2-1.6 3-2.5 5-2.2 3.4.5 5.1 3.7 3.4 7.5C21.5 18.3 14 23 14 23z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M4 8h4.5c3 0 4.8 1.2 6.8 4.2l2.3 3.5c1.2 1.9 2.2 3.3 4.4 3.3H24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 5h4v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 20h4.5c2.8 0 4.2-1.2 5.8-3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 23h4v-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 6-6h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 4l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 18a6 6 0 0 1-6 6H8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 24l-3-3 3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
          --bg-deep: #0A0A0A;
          --bg-soft: #111111;
          --gold: #C9A84C;
          --crimson: #C0392B;
          --muted: #666666;
          --track: #222222;
          --curve: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --font-heading: 'Bebas Neue', sans-serif;
          --font-title: 'DM Serif Display', serif;
          --font-meta: 'Space Mono', monospace;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #000;
        }

        .rewind-stage {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: stretch;
          background: #000;
          padding: 0;
        }

        .rewind-phone {
          width: 390px;
          min-height: 844px;
          background: linear-gradient(180deg, var(--bg-deep), var(--bg-soft));
          color: #EDE8D8;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 18px 18px 158px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          animation: logoDrop 0.6s var(--curve) both;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          height: 36px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        .freq {
          font-family: var(--font-meta);
          letter-spacing: 0.06em;
          color: var(--gold);
          font-size: 14px;
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
          border-radius: 18px;
          background: radial-gradient(circle at 50% 25%, #1A1A1A 0%, #0C0C0C 75%);
          box-shadow: inset 0 0 0 1px #1F1B12;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          animation: deckScale 0.6s ease-out both;
          transform-origin: center;
        }

        .turntable-wrap {
          width: 92%;
          aspect-ratio: 1 / 1;
          position: relative;
          filter: drop-shadow(0 0 20px rgba(201, 168, 76, 0.22));
        }

        .turntable {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          animation: spin 3s linear infinite;
          animation-play-state: running;
          transition: transform 0.4s var(--curve);
        }

        .turntable.paused {
          animation-play-state: paused;
        }

        .label-glow {
          position: absolute;
          width: 27%;
          aspect-ratio: 1 / 1;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(192,57,43,0.65) 0%, rgba(192,57,43,0.08) 62%, rgba(192,57,43,0) 100%);
          pointer-events: none;
          opacity: 0;
        }

        .label-glow.playing {
          opacity: 1;
          animation: pulseLabel 1.6s var(--curve) infinite;
        }

        .track-meta {
          margin-bottom: 14px;
        }

        .track-title {
          font-family: var(--font-title);
          font-size: 28px;
          line-height: 1.05;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .track-artist {
          font-family: var(--font-heading);
          font-size: 18px;
          letter-spacing: 0.08em;
          color: var(--gold);
          margin-top: 8px;
        }

        .track-album {
          font-family: var(--font-meta);
          font-size: 12px;
          letter-spacing: 0.04em;
          color: var(--muted);
          margin-top: 4px;
        }

        .scrub {
          margin-bottom: 16px;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: var(--track);
          cursor: pointer;
          touch-action: none;
        }

        .slider-fill {
          position: absolute;
          height: 100%;
          border-radius: inherit;
          background: ${STRIPE_GRADIENT};
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: var(--gold);
          border: 2px solid #1c1508;
          box-shadow: 0 0 10px rgba(201, 168, 76, 0.35);
        }

        .time-row {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-family: var(--font-meta);
          font-size: 12px;
          color: #8F8F8F;
        }

        .controls {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: 14px;
          opacity: 0;
          animation: controlsFade 0.45s var(--curve) 0.4s forwards;
        }

        .ctrl-btn {
          border: none;
          background: transparent;
          color: #DED5BC;
          width: 52px;
          height: 52px;
          margin: 0 auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          transition: transform 0.25s var(--curve), color 0.25s var(--curve);
          cursor: pointer;
        }

        .ctrl-btn:active {
          transform: scale(0.95);
        }

        .ctrl-btn svg {
          width: 28px;
          height: 28px;
          fill: currentColor;
        }

        .play-btn {
          width: 68px;
          height: 68px;
          border: 2px solid var(--gold);
          background: #19130A;
          color: var(--gold);
          box-shadow: 0 0 0 rgba(192,57,43,0);
        }

        .play-btn.active {
          background: var(--crimson);
          color: #F8EFE6;
          box-shadow: 0 0 0 0 rgba(192,57,43,0.55);
          animation: playPulse 1.6s var(--curve) infinite;
        }

        .utility-row {
          display: grid;
          grid-template-columns: auto auto auto 1fr;
          gap: 10px;
          align-items: center;
        }

        .util-btn {
          border: 1px solid #2A2416;
          color: var(--gold);
          background: #131313;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .util-btn svg {
          width: 22px;
          height: 22px;
          fill: none;
        }

        .volume-wrap {
          padding-left: 6px;
        }

        .station-row {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 92px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0 18px 4px;
          scrollbar-width: none;
        }

        .station-row::-webkit-scrollbar {
          display: none;
        }

        .chip {
          border: 1px solid var(--gold);
          background: #121212;
          color: var(--gold);
          border-radius: 999px;
          padding: 8px 14px;
          white-space: nowrap;
          font-family: var(--font-heading);
          letter-spacing: 0.05em;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s var(--curve), background 0.25s var(--curve), color 0.25s var(--curve);
        }

        .chip.active {
          background: var(--gold);
          color: #141414;
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
          border-top: 1px solid #2E2513;
          background: linear-gradient(180deg, #121212 0%, #0D0D0D 100%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
        }

        .mini-vinyl {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid #4A3918;
          box-shadow: 0 0 10px rgba(201, 168, 76, 0.22);
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
          font-family: var(--font-title);
          font-size: 18px;
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mini-artist {
          font-family: var(--font-heading);
          font-size: 14px;
          letter-spacing: 0.07em;
          color: var(--gold);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mini-toggle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1.5px solid var(--gold);
          background: #16110A;
          color: var(--gold);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          cursor: pointer;
        }

        .mini-toggle svg {
          width: 22px;
          height: 22px;
          fill: currentColor;
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

        @keyframes playPulse {
          0% { box-shadow: 0 0 0 0 rgba(192,57,43,0.5); }
          70% { box-shadow: 0 0 0 14px rgba(192,57,43,0); }
          100% { box-shadow: 0 0 0 0 rgba(192,57,43,0); }
        }

        @keyframes pulseLabel {
          0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
        }

        @media (max-width: 420px) {
          .rewind-phone {
            width: 100vw;
            min-height: 100vh;
            padding-bottom: 150px;
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
            <div className="turntable-wrap">
              <img
                src="/Player.png"
                alt="Turntable player"
                className={`turntable ${isPlaying ? '' : 'paused'}`}
              />
              <div className={`label-glow ${isPlaying ? 'playing' : ''}`} />
            </div>
          </section>

          <section className="track-meta">
            <h1 className="track-title">Midnight Frequency</h1>
            <div className="track-artist">REWIND RESIDENTS</div>
            <div className="track-album">UKW Session Vol. 4</div>
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
            <button className="ctrl-btn" aria-label="Previous track" type="button">
              <IconPrev />
            </button>
            <button className="ctrl-btn" aria-label="Rewind 10 seconds" type="button" onClick={() => seekBy(-SEEK_STEP)}>
              <IconBack10 />
            </button>
            <button
              className={`ctrl-btn play-btn ${isPlaying ? 'active' : ''}`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="ctrl-btn" aria-label="Forward 10 seconds" type="button" onClick={() => seekBy(SEEK_STEP)}>
              <IconFwd10 />
            </button>
            <button className="ctrl-btn" aria-label="Next track" type="button">
              <IconNext />
            </button>
          </section>

          <section className="utility-row" aria-label="Utility controls">
            <button className="util-btn" aria-label="Like" type="button">
              <IconHeart />
            </button>
            <button className="util-btn" aria-label="Shuffle" type="button">
              <IconShuffle />
            </button>
            <button className="util-btn" aria-label="Repeat" type="button">
              <IconRepeat />
            </button>
            <div className="volume-wrap">
              <div className="slider-track" ref={volumeRef} onPointerDown={onVolumePointerDown}>
                <div className="slider-fill" style={{ width: `${volume * 100}%` }} />
                <div className="slider-thumb" style={{ left: `${volume * 100}%` }} />
              </div>
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
              <img
                src="/Player.png"
                alt=""
                className={isPlaying ? '' : 'paused'}
              />
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
