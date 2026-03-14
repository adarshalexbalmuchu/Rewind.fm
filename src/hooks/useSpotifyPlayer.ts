import { useEffect, useRef, useState } from 'react';
import { playOnDevice, spotifyFetch, startPlaybackOnDevice, transferPlaybackToDevice } from '../lib/spotify';
import { usePlayerStore } from '../store/playerStore';

let sharedPlayer: Spotify.Player | null = null;
let sharedPlayerUsers = 0;
let scheduledDisconnect: number | null = null;

type PlayerEventName =
  | 'ready'
  | 'not_ready'
  | 'player_state_changed'
  | 'autoplay_failed'
  | 'initialization_error'
  | 'authentication_error'
  | 'account_error'
  | 'playback_error';

type SpotifyWindow = Window & typeof globalThis & {
  onSpotifyWebPlaybackSDKReady?: () => void;
  __rewindSdkScriptRequested?: boolean;
};

export function useSpotifyPlayer(
  token: string | null,
  options?: {
    onTargetUnavailable?: (trackId: string, note: string) => void;
  }
) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const tokenRef = useRef<string | null>(token);
  const creatingRef = useRef(false);
  const listenersRef = useRef<Array<{ event: PlayerEventName; listener: (...args: any[]) => void }>>([]);
  const deviceIdRef = useRef<string | null>(null);
  const switchInFlightKeyRef = useRef<string | null>(null);
  const recentSwitchRef = useRef<{ targetKey: string; at: number } | null>(null);
  const failedTargetRef = useRef<Map<string, number>>(new Map());
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const {
    setIsPlaying,
    setCurrentTime,
    setProgress,
    setPlayerStatus,
    tracks,
    currentIndex,
  } = usePlayerStore();

  tokenRef.current = token;

  const sleep = (ms: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
  const SWITCH_COOLDOWN_MS = 900;
  const TARGET_FAIL_COOLDOWN_MS = 45000;

  function buildSelection(index: number) {
    const selectedTrack = tracks[index];
    const rawSelectedUri = selectedTrack?.uri ?? '';
    const inferredContextUri = rawSelectedUri.startsWith('spotify:album:') || rawSelectedUri.startsWith('spotify:playlist:')
      ? rawSelectedUri
      : null;
    const selectedContextUri = selectedTrack?.contextUri || inferredContextUri;
    const selectedTrackUri = selectedTrack?.trackUri
      ? selectedTrack.trackUri
      : rawSelectedUri.startsWith('spotify:track:')
        ? rawSelectedUri
        : null;

    const selectedTrackUris = selectedTrackUri
      ? [selectedTrackUri]
      : (selectedTrack?.trackUris ?? []).filter((uri) => !!uri);
    const selectedOffset =
      selectedContextUri && selectedTrack?.contextOffsetPosition != null
        ? { position: selectedTrack.contextOffsetPosition }
        : null;

    const playbackPayload: {
      trackUris: string[];
      contextUri: string | null;
      offset: { position?: number; uri?: string } | null;
    } = selectedTrackUris.length > 0
      ? { trackUris: selectedTrackUris, contextUri: null, offset: null }
      : { trackUris: [], contextUri: selectedContextUri, offset: null };

    const contextOffsetPayload =
      selectedContextUri && selectedOffset
        ? {
            trackUris: [] as string[],
            contextUri: selectedContextUri,
            offset: selectedOffset,
          }
        : null;

    const fallbackPayload =
      selectedTrackUris.length > 0 && contextOffsetPayload
        ? contextOffsetPayload
        : selectedTrackUris.length === 0 && selectedTrackUri
          ? { trackUris: [selectedTrackUri], contextUri: null, offset: null }
          : null;

    const payloadStrategy =
      selectedTrackUris.length > 0
        ? 'direct-track'
        : contextOffsetPayload
          ? 'context-offset'
          : 'context-only';

    const mode = selectedTrackUri || playbackPayload.trackUris.length > 0 ? 'exact-track' : 'context-only';
    const targetKey = [selectedTrack?.id ?? 'none', selectedTrackUri ?? '', playbackPayload.contextUri ?? '', playbackPayload.offset?.position ?? ''].join('|');

    return {
      selectedTrack,
      selectedTrackUri,
      selectedContextUri,
      playbackPayload,
      fallbackPayload,
      payloadStrategy,
      hasSelectedTarget: !!playbackPayload.contextUri || playbackPayload.trackUris.length > 0,
      mode,
      targetKey,
    };
  }

  async function switchSelectionWithPlayer(
    player: Spotify.Player,
    accessToken: string,
    index: number,
    source: 'cassette-click' | 'toggle-play',
    maxAttempts: number
  ) {
    const selection = buildSelection(index);
    const {
      selectedTrack,
      selectedTrackUri,
      selectedContextUri,
      playbackPayload,
      fallbackPayload,
      payloadStrategy,
      hasSelectedTarget,
      mode,
      targetKey,
    } = selection;

    const now = Date.now();
    const failedUntil = failedTargetRef.current.get(targetKey);
    if (failedUntil && failedUntil > now) {
      return false;
    }

    console.log('[REWIND.FM] selected item:', {
      id: selectedTrack?.id,
      title: selectedTrack?.title,
      type: selectedTrack?.itemType,
    });
    console.log('[REWIND.FM] selected track URI:', selectedTrackUri);
    console.log('[REWIND.FM] selected context URI:', selectedContextUri);
    console.log('[REWIND.FM] chosen playback payload:', {
      context_uri: playbackPayload.contextUri,
      offset: playbackPayload.offset,
      uris: playbackPayload.trackUris,
    });
    console.log('[REWIND.FM] payload strategy chosen:', payloadStrategy);
    console.log('[REWIND.FM] playback mode chosen:', mode);

    if (!hasSelectedTarget) {
      return false;
    }

    if (switchInFlightKeyRef.current === targetKey) {
      console.log('[REWIND.FM] switch already in flight:', { targetKey, source });
      return false;
    }

    switchInFlightKeyRef.current = targetKey;

    const getStateSnapshot = async () => {
      const snapshot = (await spotifyFetch(async () => player.getCurrentState(), null)) ?? null;
      const currentTrackUri = snapshot?.track_window?.current_track?.uri ?? null;
      const currentContextUri = ((snapshot as any)?.context?.uri as string | undefined) ?? null;
      return {
        state: snapshot,
        currentTrackUri,
        currentContextUri,
      };
    };

    const matchesTarget = (contextUri: string | null, trackUri: string | null) => {
      if (mode === 'context-only' && playbackPayload.contextUri) {
        const matched = contextUri === playbackPayload.contextUri;
        console.log('[REWIND.FM] context-only target match by context URI:', {
          matched,
          selectedContext: playbackPayload.contextUri,
          currentContext: contextUri,
        });
        return matched;
      }

      if (selectedTrackUri) {
        return trackUri === selectedTrackUri;
      }

      if (playbackPayload.contextUri) {
        return contextUri === playbackPayload.contextUri;
      }

      return playbackPayload.trackUris.includes(trackUri ?? '');
    };

    try {
      await player.activateElement();

      const activeDeviceId = deviceIdRef.current ?? deviceId;
      if (!activeDeviceId) {
        return false;
      }

      const before = await getStateSnapshot();
      if (matchesTarget(before.currentContextUri, before.currentTrackUri)) {
        console.log('[REWIND.FM] final switch success:', { targetKey, source, attempt: 0, alreadyActive: true });
        return source !== 'toggle-play';
      }

      const attempts = Math.max(1, Math.min(maxAttempts, 2));
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        console.log('[REWIND.FM] start-switch attempt count:', { attempt, targetKey, source });

        await transferPlaybackToDevice(accessToken, activeDeviceId, false);
        await sleep(180);

        let startResult = await startPlaybackOnDevice(accessToken, activeDeviceId, {
          contextUri: playbackPayload.contextUri,
          trackUris: playbackPayload.trackUris,
          offset: playbackPayload.offset,
        });

        if (!startResult.ok && startResult.status === 403) {
          console.log('[REWIND.FM] 403 body:', startResult.body);
        }

        let fallbackTried = false;
        let fallback403 = false;
        if (!startResult.ok && startResult.status === 403 && fallbackPayload) {
          fallbackTried = true;
          console.log('[REWIND.FM] retry fallback used:', {
            from: payloadStrategy,
            to: payloadStrategy === 'direct-track' ? 'context-offset' : 'direct-track',
          });

          startResult = await startPlaybackOnDevice(accessToken, activeDeviceId, {
            contextUri: fallbackPayload.contextUri,
            trackUris: fallbackPayload.trackUris,
            offset: fallbackPayload.offset,
          });

          if (!startResult.ok && startResult.status === 403) {
            console.log('[REWIND.FM] 403 body:', startResult.body);
            fallback403 = true;
          }
        }

        if (!startResult.ok && startResult.status === 403 && payloadStrategy === 'direct-track' && fallbackTried && fallback403) {
          failedTargetRef.current.set(targetKey, Date.now() + TARGET_FAIL_COOLDOWN_MS);
          if (selectedTrack?.id) {
            options?.onTargetUnavailable?.(
              selectedTrack.id,
              'Spotify blocked direct track playback for this cassette. Using fallback behavior for now.'
            );
          }
          console.log('[REWIND.FM] exact-track target marked failed after repeated 403:', {
            targetKey,
            cooldownMs: TARGET_FAIL_COOLDOWN_MS,
          });
          return false;
        }

        await sleep(260);
        const afterStart = await getStateSnapshot();
        const targetMatched = matchesTarget(afterStart.currentContextUri, afterStart.currentTrackUri);

        if (targetMatched) {
          if (afterStart.state?.paused) {
            await spotifyFetch(async () => {
              await player.resume();
              return undefined;
            }, undefined);

            await sleep(160);
            const afterResume = await getStateSnapshot();
            if (afterResume.state?.paused) {
              await playOnDevice(accessToken, activeDeviceId);
            }
          }

          console.log('[REWIND.FM] final switch success:', { targetKey, source, attempt });
          if (source === 'cassette-click') {
            recentSwitchRef.current = {
              targetKey,
              at: Date.now(),
            };
          }
          return true;
        }
      }

      return false;
    } finally {
      if (switchInFlightKeyRef.current === targetKey) {
        switchInFlightKeyRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (!token) {
      setPlayerStatus('disconnected');
      return;
    }

    setPlayerStatus('initializing');

    sharedPlayerUsers += 1;
    if (scheduledDisconnect !== null) {
      window.clearTimeout(scheduledDisconnect);
      scheduledDisconnect = null;
    }

    const addPlayerListener = (player: Spotify.Player, event: PlayerEventName, listener: (...args: any[]) => void) => {
      (player as any).addListener(event, listener);
      listenersRef.current.push({ event, listener });
    };

    const bindListeners = (player: Spotify.Player) => {
      addPlayerListener(player, 'not_ready', () => {
        console.log('[REWIND.FM] player disconnected/unavailable');
        setPlayerStatus('initializing');
      });

      addPlayerListener(player, 'ready', ({ device_id }: { device_id: string }) => {
        console.log('[REWIND.FM] player ready:', { device_id });
        setDeviceId(device_id);
        deviceIdRef.current = device_id;
        setPlayerStatus('ready');

        const accessToken = tokenRef.current;
        if (accessToken) {
          void transferPlaybackToDevice(accessToken, device_id, false);
        }
      });

      addPlayerListener(player, 'autoplay_failed', () => {
        console.warn('[REWIND.FM] autoplay_failed');
      });

      addPlayerListener(player, 'initialization_error', ({ message }: { message: string }) => {
        console.error('[REWIND.FM] initialization_error:', message);
        setPlayerStatus('no_premium');
      });

      addPlayerListener(player, 'authentication_error', ({ message }: { message: string }) => {
        console.error('[REWIND.FM] authentication_error:', message);
        setPlayerStatus('disconnected');
      });

      addPlayerListener(player, 'account_error', ({ message }: { message: string }) => {
        console.error('[REWIND.FM] account_error:', message);
        setPlayerStatus('no_premium');
      });

      addPlayerListener(player, 'playback_error', ({ message }: { message: string }) => {
        console.error('[REWIND.FM] playback_error:', message);
      });

      addPlayerListener(player, 'player_state_changed', (state: Spotify.PlaybackState) => {
        if (!state) {
          return;
        }

        const pos = state.position / 1000;
        const dur = state.duration / 1000;
        setCurrentTime(pos);
        setProgress(dur > 0 ? pos / dur : 0);
        setIsPlaying(!state.paused);
      });
    };

    const createOrReusePlayer = async () => {
      if (sharedPlayer) {
        console.log('[REWIND.FM] player reused/skipped');
        playerRef.current = sharedPlayer;
        bindListeners(sharedPlayer);
        return;
      }

      if (creatingRef.current) {
        console.log('[REWIND.FM] player reused/skipped');
        return;
      }

      creatingRef.current = true;

      const player = new Spotify.Player({
        name: 'REWIND.FM',
        getOAuthToken: (cb: (newToken: string) => void) => cb(tokenRef.current ?? ''),
        volume: 0.8,
      });

      console.log('[REWIND.FM] player created');
      sharedPlayer = player;
      playerRef.current = player;
      bindListeners(player);

      await spotifyFetch(async () => {
        const connected = await player.connect();
        return connected;
      }, false);

      creatingRef.current = false;
    };

    const onSdkReady = () => {
      void createOrReusePlayer();
    };

    const spotifyWindow = window as SpotifyWindow;
    spotifyWindow.onSpotifyWebPlaybackSDKReady = onSdkReady;

    if ((window as Window & typeof globalThis & { Spotify?: typeof Spotify }).Spotify) {
      onSdkReady();
    } else if (!spotifyWindow.__rewindSdkScriptRequested) {
      spotifyWindow.__rewindSdkScriptRequested = true;
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }

    return () => {
      const player = playerRef.current;
      if (player) {
        for (const { event, listener } of listenersRef.current) {
          (player as any).removeListener(event, listener);
        }
      }
      listenersRef.current = [];

      sharedPlayerUsers = Math.max(0, sharedPlayerUsers - 1);
      if (sharedPlayerUsers === 0 && sharedPlayer) {
        scheduledDisconnect = window.setTimeout(() => {
          if (sharedPlayerUsers === 0 && sharedPlayer) {
            sharedPlayer.disconnect();
            console.log('[REWIND.FM] player disconnected');
            sharedPlayer = null;
          }
          scheduledDisconnect = null;
        }, 500);
      }
    };
  }, [token, setIsPlaying, setCurrentTime, setProgress, setPlayerStatus]);

  async function runPlayerCall(fn: (player: Spotify.Player) => Promise<void>) {
    await spotifyFetch(async () => {
      const player = playerRef.current;
      if (!player) {
        console.log('[REWIND.FM] player reused/skipped');
        return;
      }
      await fn(player);
    }, undefined);
  }

  const togglePlay = () => {
    if (!token) return;
    const accessToken = token;

    void runPlayerCall(async (player) => {
      console.log('[REWIND.FM] play requested');

      const selection = buildSelection(currentIndex);
      const selectedTargetKey = selection.targetKey;
        const recentSwitch = recentSwitchRef.current;
        if (recentSwitch && recentSwitch.targetKey === selectedTargetKey && Date.now() - recentSwitch.at < SWITCH_COOLDOWN_MS) {
          console.log('[REWIND.FM] switch cooldown active:', {
            targetKey: selectedTargetKey,
          });
          return;
        }

      const state = (await spotifyFetch(async () => player.getCurrentState(), null)) ?? null;
      const currentTrackUri = state?.track_window?.current_track?.uri ?? null;
      const currentContextUri = ((state as any)?.context?.uri as string | undefined) ?? null;
      const currentTargetKey = [
        state?.track_window?.current_track?.id ?? 'none',
        currentTrackUri ?? '',
        currentContextUri ?? '',
        '',
      ].join('|');

      console.log('[REWIND.FM] current target key:', currentTargetKey);
      console.log('[REWIND.FM] selected target key:', selectedTargetKey);

      const selectedMatchesCurrent = selection.hasSelectedTarget
        ? selection.selectedTrackUri
          ? currentTrackUri === selection.selectedTrackUri
          : selection.playbackPayload.contextUri
            ? currentContextUri === selection.playbackPayload.contextUri
            : selection.playbackPayload.trackUris.includes(currentTrackUri ?? '')
        : false;

      if (selection.hasSelectedTarget && !selectedMatchesCurrent) {
        console.log('[REWIND.FM] play route chosen: start-selected');
        await switchSelectionWithPlayer(player, accessToken, currentIndex, 'toggle-play', 1);
        return;
      }

      console.log('[REWIND.FM] play route chosen: toggle-active');
      await player.activateElement();

      const activeDeviceId = deviceIdRef.current ?? deviceId;

      console.log('[REWIND.FM] getCurrentState result:', {
        hasState: !!state,
        paused: state?.paused,
      });

      if (!state && activeDeviceId) {
        console.log('[REWIND.FM] action: resume');
        await playOnDevice(accessToken, activeDeviceId);
        return;
      }

      if (state?.paused) {
        console.log('[REWIND.FM] resume requested');
        console.log('[REWIND.FM] action: resume');
        await spotifyFetch(async () => {
          await player.resume();
          return undefined;
        }, undefined);

        const afterResume = (await spotifyFetch(async () => player.getCurrentState(), null)) ?? null;
        if (afterResume?.paused && activeDeviceId) {
          console.log('[REWIND.FM] action: resume');
          await playOnDevice(accessToken, activeDeviceId);
        }
        return;
      }

      await spotifyFetch(async () => {
        await player.pause();
        return undefined;
      }, undefined);
    });
  };

  const switchToIndex = (index: number) => {
    if (!token) {
      return;
    }

    const accessToken = token;
    void runPlayerCall(async (player) => {
      await switchSelectionWithPlayer(player, accessToken, index, 'cassette-click', 2);
    });
  };
  const previousTrack = () => {
    void runPlayerCall(async (player) => {
      await player.activateElement();
      await player.previousTrack();
    });
  };
  const nextTrack = () => {
    void runPlayerCall(async (player) => {
      await player.activateElement();
      await player.nextTrack();
    });
  };
  const seek = (posMs: number) => {
    void runPlayerCall((player) => player.seek(posMs));
  };

  return { deviceId, togglePlay, previousTrack, nextTrack, seek, switchToIndex };
}
