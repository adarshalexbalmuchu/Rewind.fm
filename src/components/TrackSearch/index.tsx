import { type FormEvent, useState } from 'react';
import { searchSpotifyTracks } from '../../lib/spotify';
import styles from './TrackSearch.module.css';

type SearchTrack = {
  id?: string;
  name?: string;
  uri?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    uri?: string;
    release_date?: string;
    images?: Array<{ url?: string }>;
  };
};

interface Props {
  token: string;
  onPickTrack: (track: SearchTrack) => void;
}

export function TrackSearch({ token, onPickTrack }: Props) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  async function handleSearch() {
    if (!trimmedQuery) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await searchSpotifyTracks(token, trimmedQuery);
      const tracks = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
      setResults(tracks);
    } catch {
      setResults([]);
      setSearchError('Search could not complete. Please try again in a moment.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setSearchError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSearch();
  }

  return (
    <div className={styles.wrap} aria-busy={isSearching}>
      <div className={styles.head}>Search</div>

      <form className={styles.row} onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
          placeholder="Type a song title"
          aria-label="Search song title"
        />
        <button className={styles.btn} type="submit" disabled={isSearching || !trimmedQuery}>
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          className={styles.btnAlt}
          type="button"
          onClick={handleClear}
          disabled={isSearching || (!trimmedQuery && results.length === 0 && !searchError)}
        >
          Clear
        </button>
      </form>

      {isSearching && (
        <div className={`${styles.status} ${styles.statusInfo}`} role="status" aria-live="polite">
          Searching...
        </div>
      )}

      {searchError && (
        <div className={`${styles.status} ${styles.statusError}`} role="status" aria-live="polite">
          {searchError}
        </div>
      )}

      {isSearching && (
        <div className={styles.results} aria-hidden="true">
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className={styles.results}>
          {results.map((track) => (
            <div key={track.id ?? track.uri} className={styles.item}>
              <div className={styles.meta}>
                <div className={styles.title}>{track.name ?? 'Untitled'}</div>
                <div className={styles.artist}>
                  {track.artists?.[0]?.name ?? 'Unknown Artist'}
                </div>
              </div>
              <button className={styles.add} onClick={() => onPickTrack(track)}>
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {!isSearching && !searchError && trimmedQuery.length > 0 && results.length === 0 && (
        <div className={styles.empty}>No results. Try another title.</div>
      )}
    </div>
  );
}
