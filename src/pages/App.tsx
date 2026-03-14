import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { RainbowStripe } from '../components/RainbowStripe';
import { TapeLibrary } from '../components/TapeLibrary';
import { PlayerPanel } from '../components/PlayerPanel';
import { TrackSearch } from '../components/TrackSearch';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { usePlayerState } from '../hooks/usePlayerState';
import { getCassetteStyle, getLabelColor } from '../lib/colorUtils';
import { fetchCurrentUserProfile, fetchPlaylistFirstTrack, fetchSavedTracks, fetchUserPlaylists } from '../lib/spotify';
import { usePlayerStore, type Track } from '../store/playerStore';
import { DEMO_LIBRARY } from '../lib/demoData';
import styles from './App.module.css';

const MOOD_SHELVES = ['Midnight Drive', 'Hostel Nostalgia', 'Rainy Window', 'Healing', 'Sunday Slowdown'] as const;
const MEMORY_NOTES = [
  'You played this while the city slept and the roads stayed empty.',
  'A shared room, one speaker, and that one song everyone knew.',
  'Rain-streaked glass and soft streetlights in the distance.',
  'A track you reached for when things felt heavy.',
  'Slow morning sunlight and nowhere urgent to be.',
] as const;
const DEFAULT_SHELVES = [...MOOD_SHELVES, 'Memory Cassettes'] as const;
const LOCAL_COLLECTION_KEY = 'rewindfm_v3_collection';

type EditableTapeMetadata = {
  moodTag: string;
  memoryNote: string;
  shelfName: string;
  cassetteTheme: string;
  pinned: boolean;
  archived: boolean;
  unavailable: boolean;
  unavailableNote: string;
};

type LocalCollectionState = {
  customTracks: Track[];
  metadataById: Record<string, Partial<EditableTapeMetadata>>;
  recentlyRewoundIds: string[];
  customShelves: string[];
  manualOrderIds: string[];
};

function loadLocalCollection(): LocalCollectionState {
  try {
    const raw = localStorage.getItem(LOCAL_COLLECTION_KEY);
    if (!raw) {
      return { customTracks: [], metadataById: {}, recentlyRewoundIds: [], customShelves: [], manualOrderIds: [] };
    }
    const parsed = JSON.parse(raw) as Partial<LocalCollectionState>;
    return {
      customTracks: Array.isArray(parsed.customTracks) ? parsed.customTracks : [],
      metadataById: parsed.metadataById ?? {},
      recentlyRewoundIds: Array.isArray(parsed.recentlyRewoundIds) ? parsed.recentlyRewoundIds : [],
      customShelves: Array.isArray(parsed.customShelves) ? parsed.customShelves : [],
      manualOrderIds: Array.isArray(parsed.manualOrderIds) ? parsed.manualOrderIds : [],
    };
  } catch {
    return { customTracks: [], metadataById: {}, recentlyRewoundIds: [], customShelves: [], manualOrderIds: [] };
  }
}

function applyLocalMetadata(track: Track, metadataById: Record<string, Partial<EditableTapeMetadata>>): Track {
  const local = metadataById[track.id];
  if (!local) {
    return track;
  }

  return {
    ...track,
    moodTag: local.moodTag ?? track.moodTag,
    memoryNote: local.memoryNote ?? track.memoryNote,
    shelfName: local.shelfName ?? track.shelfName,
    cassetteTheme: local.cassetteTheme ?? track.cassetteTheme,
    pinned: local.pinned ?? track.pinned,
    archived: local.archived ?? track.archived,
    unavailable: local.unavailable ?? track.unavailable,
    unavailableNote: local.unavailableNote ?? track.unavailableNote,
  };
}

function applyManualOrder(trackList: Track[], manualOrderIds: string[]) {
  const orderMap = new Map<string, number>();
  manualOrderIds.forEach((id, index) => orderMap.set(id, index));

  return [...trackList].sort((a, b) => {
    const aPinned = a.pinned ? 0 : 1;
    const bPinned = b.pinned ? 0 : 1;
    if (aPinned !== bPinned) {
      return aPinned - bPinned;
    }

    const aArchived = a.archived ? 1 : 0;
    const bArchived = b.archived ? 1 : 0;
    if (aArchived !== bArchived) {
      return aArchived - bArchived;
    }

    const aOrder = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bOrder = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.title.localeCompare(b.title);
  });
}

function mapDemoLibraryToTracks(): Track[] {
  const styleMap = {
    yellow: 'yellow-black',
    cream: 'cream-black',
    red: 'grey-red',
    amber: 'amber-brown',
    blue: 'navy-blue',
    green: 'green-black',
  } as const;

  return DEMO_LIBRARY.map((item, index) => {
    const cassetteStyle = styleMap[item.cassetteColor] ?? getCassetteStyle(index);
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      year: item.year,
      duration: 210,
      albumId: item.id,
      uri: '',
      itemType: 'track',
      source: 'demo',
      trackUri: '',
      trackId: '',
      albumUri: '',
      albumName: item.title,
      coverImage: '',
      contextUri: '',
      contextOffsetPosition: null,
      trackUris: [],
      moodTag: MOOD_SHELVES[index % MOOD_SHELVES.length],
      memoryNote: MEMORY_NOTES[index % MEMORY_NOTES.length],
      cassetteTheme: `theme-${(index % 5) + 1}`,
      yearLabel: item.year,
      shelfName: MOOD_SHELVES[index % MOOD_SHELVES.length],
      labelColor: getLabelColor(cassetteStyle),
      cassetteStyle,
    };
  });
}

function mapSpotifyTrackToCassette(
  track: {
    id?: string;
    name?: string;
    uri?: string;
    duration_ms?: number;
    artists?: Array<{ name?: string }>;
    album?: {
      id?: string;
      name?: string;
      uri?: string;
      release_date?: string;
      images?: Array<{ url?: string }>;
    };
  },
  index: number,
  shelfName?: string,
  source: Track['source'] = 'spotify-library'
): Track {
  const style = getCassetteStyle(index);
  const year = (track.album?.release_date ?? '----').slice(0, 4);
  const moodTag = shelfName ?? MOOD_SHELVES[index % MOOD_SHELVES.length];

  return {
    id: track.id ?? `track-${index + 1}`,
    title: (track.name ?? 'UNTITLED SONG').toUpperCase(),
    artist: (track.artists?.[0]?.name ?? 'UNKNOWN').toUpperCase(),
    year,
    duration: Math.max(1, Math.floor((track.duration_ms ?? 180000) / 1000)),
    albumId: track.album?.id ?? `album-${index + 1}`,
    uri: track.uri ?? '',
    itemType: 'track',
    source,
    trackUri: track.uri ?? '',
    trackId: track.id ?? '',
    albumUri: track.album?.uri ?? '',
    albumName: (track.album?.name ?? '').toUpperCase(),
    coverImage: track.album?.images?.[0]?.url ?? '',
    contextUri: track.album?.uri ?? '',
    contextOffsetPosition: null,
    trackUris: track.uri ? [track.uri] : [],
    moodTag,
    memoryNote: MEMORY_NOTES[index % MEMORY_NOTES.length],
    cassetteTheme: `theme-${(index % 5) + 1}`,
    yearLabel: year,
    shelfName: moodTag,
    labelColor: getLabelColor(style),
    cassetteStyle: style,
  };
}

export function App() {
  const { isConnected, connect, getToken } = useSpotifyAuth();
  const token = getToken();
  const { togglePlay, previousTrack, nextTrack, seek, switchToIndex } = useSpotifyPlayer(token, {
    onTargetUnavailable: handleMarkUnavailable,
  });
  const {
    tracks,
    currentIndex,
    isLoading,
    setTracks,
    setIsLoading,
    setIsConnected,
    playerStatus,
    setPlayerStatus,
    setIsDemoMode,
  } = usePlayerStore();
  const [localCollection, setLocalCollection] = useState<LocalCollectionState>(loadLocalCollection);
  const localCollectionRef = useRef(localCollection);
  const [newShelfName, setNewShelfName] = useState('');
  const [collectionNotice, setCollectionNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const allShelves = useMemo(() => {
    const fromTracks = tracks.map((track) => track.shelfName).filter((shelf): shelf is string => !!shelf);
    return Array.from(new Set([...DEFAULT_SHELVES, ...localCollection.customShelves, ...fromTracks]));
  }, [localCollection.customShelves, tracks]);

  function rebuildTracksWithOrder(nextTracks: Track[], manualOrderIds: string[]) {
    const songs = nextTracks.filter((track) => track.itemType !== 'playlist');
    const playlists = nextTracks.filter((track) => track.itemType === 'playlist');
    const orderedSongs = applyManualOrder(songs, manualOrderIds);
    return [...orderedSongs, ...playlists];
  }

  useEffect(() => {
    localCollectionRef.current = localCollection;
    localStorage.setItem(LOCAL_COLLECTION_KEY, JSON.stringify(localCollection));
  }, [localCollection]);

  useEffect(() => {
    if (!collectionNotice) {
      return;
    }

    const id = window.setTimeout(() => setCollectionNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [collectionNotice]);

  useEffect(() => {
    const active = tracks[currentIndex];
    if (!active?.id) {
      return;
    }

    setLocalCollection((prev) => {
      const nextIds = [active.id, ...prev.recentlyRewoundIds.filter((id) => id !== active.id)].slice(0, 8);
      return {
        ...prev,
        recentlyRewoundIds: nextIds,
      };
    });
  }, [tracks, currentIndex]);

  const recentlyRewound = useMemo(
    () => localCollection.recentlyRewoundIds
      .map((id) => tracks.find((track) => track.id === id))
      .filter((track): track is Track => !!track),
    [localCollection.recentlyRewoundIds, tracks]
  );

  function handleUpdateTrackMetadata(trackId: string, updates: EditableTapeMetadata) {
    setTracks(
      tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              moodTag: updates.moodTag,
              memoryNote: updates.memoryNote,
              shelfName: updates.shelfName,
              cassetteTheme: updates.cassetteTheme,
            }
          : track
      )
    );

    setLocalCollection((prev) => ({
      ...prev,
      metadataById: {
        ...prev.metadataById,
        [trackId]: updates,
      },
    }));
  }

  function updateTrackFlags(trackId: string, updates: Partial<EditableTapeMetadata>) {
    const nextTracks = tracks.map((track) => (track.id === trackId ? { ...track, ...updates } : track));
    const ordered = rebuildTracksWithOrder(nextTracks, localCollectionRef.current.manualOrderIds);
    setTracks(ordered);
    setLocalCollection((prev) => ({
      ...prev,
      metadataById: {
        ...prev.metadataById,
        [trackId]: {
          ...prev.metadataById[trackId],
          ...updates,
        },
      },
    }));
  }

  function handleMarkUnavailable(trackId: string, note: string) {
    updateTrackFlags(trackId, { unavailable: true, unavailableNote: note });
  }

  function handleMoveTrack(trackId: string, dir: -1 | 1) {
    const songIds = tracks.filter((track) => track.itemType !== 'playlist').map((track) => track.id);
    const index = songIds.indexOf(trackId);
    if (index < 0) {
      return;
    }

    const next = index + dir;
    if (next < 0 || next >= songIds.length) {
      return;
    }

    const reordered = [...songIds];
    const temp = reordered[index];
    reordered[index] = reordered[next];
    reordered[next] = temp;

    setLocalCollection((prev) => ({
      ...prev,
      manualOrderIds: reordered,
    }));
    setTracks(rebuildTracksWithOrder(tracks, reordered));
  }

  function handleReorderTracks(fromId: string, toId: string) {
    if (!fromId || !toId || fromId === toId) {
      return;
    }

    const currentOrder = tracks
      .filter((track) => track.itemType !== 'playlist')
      .map((track) => track.id);

    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const reordered = [...currentOrder];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setLocalCollection((prev) => ({
      ...prev,
      manualOrderIds: reordered,
    }));
    setTracks(rebuildTracksWithOrder(tracks, reordered));
  }

  function handleCreateShelf() {
    const name = newShelfName.trim();
    if (!name || allShelves.includes(name)) {
      return;
    }

    setLocalCollection((prev) => ({
      ...prev,
      customShelves: [...prev.customShelves, name],
    }));
    setNewShelfName('');
  }

  function handleRenameShelf(oldName: string, newName: string) {
    const name = newName.trim();
    if (!name || oldName === name || (DEFAULT_SHELVES as readonly string[]).includes(oldName) || allShelves.includes(name)) {
      return;
    }

    setTracks(
      tracks.map((track) =>
        track.shelfName === oldName
          ? { ...track, shelfName: name }
          : track
      )
    );

    setLocalCollection((prev) => {
      const metadataById: Record<string, Partial<EditableTapeMetadata>> = { ...prev.metadataById };
      for (const track of tracks) {
        if (track.shelfName === oldName) {
          metadataById[track.id] = {
            ...metadataById[track.id],
            shelfName: name,
          };
        }
      }

      return {
        ...prev,
        customShelves: prev.customShelves.map((shelf) => (shelf === oldName ? name : shelf)),
        metadataById,
      };
    });
  }

  function handleDeleteShelf(name: string) {
    if ((DEFAULT_SHELVES as readonly string[]).includes(name)) {
      return;
    }

    setTracks(
      tracks.map((track) =>
        track.shelfName === name
          ? { ...track, shelfName: 'Memory Cassettes' }
          : track
      )
    );

    setLocalCollection((prev) => {
      const metadataById: Record<string, Partial<EditableTapeMetadata>> = { ...prev.metadataById };
      for (const track of tracks) {
        if (track.shelfName === name) {
          metadataById[track.id] = {
            ...metadataById[track.id],
            shelfName: 'Memory Cassettes',
          };
        }
      }

      return {
        ...prev,
        customShelves: prev.customShelves.filter((shelf) => shelf !== name),
        metadataById,
      };
    });
  }

  function handleExportCollection() {
    const payload = {
      version: 'rewindfm-v3',
      exportedAt: new Date().toISOString(),
      collection: localCollectionRef.current,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rewindfm-collection.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setCollectionNotice({ tone: 'ok', text: 'Collection exported as rewindfm-collection.json' });
  }

  function handleImportCollection(jsonText: string) {
    try {
      const parsed = JSON.parse(jsonText) as { version?: string; collection?: Partial<LocalCollectionState> };
      const imported = parsed.collection ?? (parsed as Partial<LocalCollectionState>);

      if (
        !imported
        || (imported.customTracks != null && !Array.isArray(imported.customTracks))
        || (imported.recentlyRewoundIds != null && !Array.isArray(imported.recentlyRewoundIds))
        || (imported.customShelves != null && !Array.isArray(imported.customShelves))
        || (imported.manualOrderIds != null && !Array.isArray(imported.manualOrderIds))
        || (imported.metadataById != null && typeof imported.metadataById !== 'object')
      ) {
        throw new Error('schema');
      }

      if (parsed.version && parsed.version !== 'rewindfm-v3') {
        setCollectionNotice({ tone: 'error', text: `Import warning: expected rewindfm-v3, got ${parsed.version}` });
      }

      setLocalCollection({
        customTracks: Array.isArray(imported.customTracks) ? imported.customTracks : [],
        metadataById: imported.metadataById ?? {},
        recentlyRewoundIds: Array.isArray(imported.recentlyRewoundIds) ? imported.recentlyRewoundIds : [],
        customShelves: Array.isArray(imported.customShelves) ? imported.customShelves : [],
        manualOrderIds: Array.isArray(imported.manualOrderIds) ? imported.manualOrderIds : [],
      });
      setCollectionNotice({ tone: 'ok', text: 'Collection imported successfully.' });
    } catch {
      console.warn('[REWIND.FM] Invalid collection import file.');
      setCollectionNotice({ tone: 'error', text: 'Import failed. JSON is invalid or not a supported collection format.' });
    }
  }

  function handleAddSearchTrack(track: {
    id?: string;
    name?: string;
    uri?: string;
    duration_ms?: number;
    artists?: Array<{ name?: string }>;
    album?: {
      id?: string;
      name?: string;
      uri?: string;
      release_date?: string;
      images?: Array<{ url?: string }>;
    };
  }) {
    const cassette = mapSpotifyTrackToCassette(track, 0, 'Memory Cassettes', 'search');

    setTracks([
      cassette,
      ...tracks.filter((item) => item.id !== cassette.id),
    ].slice(0, 60));

    setLocalCollection((prev) => ({
      ...prev,
      customTracks: [
        cassette,
        ...prev.customTracks.filter((item) => item.id !== cassette.id),
      ].slice(0, 40),
      manualOrderIds: [
        cassette.id,
        ...prev.manualOrderIds.filter((id) => id !== cassette.id),
      ],
    }));

    setIsDemoMode(false);
  }

  usePlayerState(isConnected);

  useEffect(() => {
    setIsConnected(isConnected);
    if (!isConnected) {
      setPlayerStatus('disconnected');
      setIsDemoMode(true);
    }
  }, [isConnected, setIsConnected, setPlayerStatus, setIsDemoMode]);

  useEffect(() => {
    if (!token) {
      setTracks(mapDemoLibraryToTracks());
      setIsLoading(false);
      return;
    }

    const spotifyToken = token;

    let cancelled = false;

    async function loadSpotifyLibrary() {
      setIsLoading(true);
      try {
        const [savedTracksData, playlistsData, meData] = await Promise.all([
          fetchSavedTracks(spotifyToken),
          fetchUserPlaylists(spotifyToken),
          fetchCurrentUserProfile(spotifyToken),
        ]);
        const currentUserId = meData?.id ?? null;

        const songCassettes: Track[] = Array.isArray(savedTracksData?.items)
          ? savedTracksData.items.map((entry: { track?: any }, index: number) =>
              mapSpotifyTrackToCassette(entry.track ?? {}, index, undefined, 'spotify-library')
            )
          : [];

        const localState = localCollectionRef.current;
        const mergedSongCassettes = songCassettes.map((track) => applyLocalMetadata(track, localState.metadataById));
        const mergedCustomTracks = localState.customTracks
          .map((track) => applyLocalMetadata(track, localState.metadataById))
          .filter((track) => track.itemType === 'track');

        const baseIndex = songCassettes.length;
        const playlistTracks = Array.isArray(playlistsData?.items)
          ? await Promise.all(playlistsData.items.map(async (playlist: { id?: string; name?: string; owner?: { display_name?: string; id?: string }; uri?: string; public?: boolean; collaborative?: boolean }, index: number) => {
              const style = getCassetteStyle(baseIndex + index);
              const playlistId = playlist.id ?? `playlist-${index + 1}`;
              const ownerId = playlist.owner?.id ?? null;
              const isOwnedByCurrentUser = !!currentUserId && ownerId === currentUserId;
              const likelyRestricted = !isOwnedByCurrentUser && !playlist.public;

              const firstTrack = playlist.id && !likelyRestricted
                ? await fetchPlaylistFirstTrack(spotifyToken, playlist.id)
                : { uri: null, offsetPosition: null };

              if (likelyRestricted) {
                console.log('[REWIND.FM] playlist enrichment skipped, using context-only:', {
                  playlistId,
                  reason: 'likely-restricted',
                });
              }

              return {
                id: playlistId,
                title: (playlist.name ?? 'UNTITLED PLAYLIST').toUpperCase(),
                artist: (playlist.owner?.display_name ?? 'SPOTIFY').toUpperCase(),
                year: '----',
                duration: 210,
                albumId: playlistId,
                uri: playlist.uri ?? '',
                itemType: 'playlist',
                source: 'playlist',
                trackUri: firstTrack.uri ?? '',
                trackId: '',
                albumUri: '',
                albumName: (playlist.name ?? 'PLAYLIST').toUpperCase(),
                coverImage: '',
                contextUri: playlist.uri ?? '',
                contextOffsetPosition: firstTrack.offsetPosition,
                trackUris: firstTrack.uri ? [firstTrack.uri] : [],
                moodTag: 'Mood Shelves',
                memoryNote: 'Playlist fallback cassette (context-only when needed).',
                cassetteTheme: 'playlist-context',
                yearLabel: '----',
                shelfName: 'Mood Shelves',
                labelColor: getLabelColor(style),
                cassetteStyle: style,
              };
            }))
          : [];

        const combinedById = new Map<string, Track>();
        for (const item of [...mergedCustomTracks, ...mergedSongCassettes, ...playlistTracks]) {
          if (!combinedById.has(item.id)) {
            combinedById.set(item.id, applyLocalMetadata(item, localState.metadataById));
          }
        }

        const mergedAll = Array.from(combinedById.values());
        const songTracks = mergedAll.filter((track) => track.itemType !== 'playlist');
        const playlists = mergedAll.filter((track) => track.itemType === 'playlist');
        const orderedSongs = applyManualOrder(songTracks, localState.manualOrderIds);
        const combined = [...orderedSongs, ...playlists].slice(0, 80);
        if (!cancelled) {
          if (combined.length > 0) {
            setTracks(combined);
            setIsDemoMode(false);
          } else {
            setTracks(mapDemoLibraryToTracks());
            setIsDemoMode(true);
          }
        }
      } catch {
        if (!cancelled) {
          setTracks(mapDemoLibraryToTracks());
          setIsDemoMode(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSpotifyLibrary();

    return () => {
      cancelled = true;
    };
  }, [token, setIsLoading, setTracks, setIsDemoMode]);

  const shouldDimPlayback = playerStatus === 'disconnected';

  return (
    <div className={styles.app}>
      <div className={`${styles.shell} ${shouldDimPlayback ? styles.shellDimmed : ''}`}>
        <Header isConnected={isConnected} onConnect={connect} />
        <div className={styles.playArea}>
          <RainbowStripe />
          <div className={styles.body}>
            <TapeLibrary
              isLoading={isLoading}
              onSelectCassette={isConnected ? switchToIndex : undefined}
              onMoveTrack={handleMoveTrack}
              recentlyRewound={recentlyRewound}
              shelves={allShelves}
              newShelfName={newShelfName}
              onNewShelfNameChange={setNewShelfName}
              onCreateShelf={handleCreateShelf}
              onRenameShelf={handleRenameShelf}
              onDeleteShelf={handleDeleteShelf}
              onExportCollection={handleExportCollection}
              onImportCollection={handleImportCollection}
              onReorderTracks={handleReorderTracks}
              collectionNotice={collectionNotice}
            />
            <PlayerPanel
              onTogglePlay={isConnected ? togglePlay : undefined}
              onPrev={isConnected ? previousTrack : undefined}
              onNext={isConnected ? nextTrack : undefined}
              onSeek={isConnected ? seek : undefined}
              onUpdateMetadata={handleUpdateTrackMetadata}
              onMoveTrack={handleMoveTrack}
              shelves={allShelves}
            />
          </div>
          {token && <TrackSearch token={token} onPickTrack={handleAddSearchTrack} />}
          <RainbowStripe reversed />
        </div>
      </div>
    </div>
  );
}
