const BASE = 'https://api.spotify.com/v1';
const playlistFirstTrackCache = new Map<string, { uri: string | null; offsetPosition: number | null }>();
const playlistFirstTrackInFlight = new Map<string, Promise<{ uri: string | null; offsetPosition: number | null }>>();
const playlistForbiddenLogged = new Set<string>();

export async function spotifyFetch<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const result = await fn();
    return result;
  } catch (err: any) {
    if (err?.status === 403) {
      console.warn('[REWIND.FM] Spotify access restricted:', err);
    } else if (err?.status === 401) {
      localStorage.removeItem('spotify_token');
      window.location.href = import.meta.env.BASE_URL;
    }
    return fallback;
  }
}

function toSpotifyError(status: number, body?: unknown) {
  return { status, body };
}

async function parseSpotifyResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchSavedAlbums(token: string) {
  return spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/albums?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw toSpotifyError(res.status);
    }
    return res.json();
  }, { items: [] });
}

export async function fetchSavedTracks(token: string) {
  return spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/tracks?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    return res.json();
  }, { items: [] });
}

export async function searchSpotifyTracks(token: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: { items: [] } };
  }

  return spotifyFetch(async () => {
    const params = new URLSearchParams({
      q: trimmed,
      type: 'track',
      limit: '8',
    });
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    return res.json();
  }, { tracks: { items: [] } });
}

export async function fetchUserPlaylists(token: string) {
  return spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/playlists?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw toSpotifyError(res.status);
    }
    return res.json();
  }, { items: [] });
}

export async function fetchCurrentUserProfile(token: string) {
  return spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    return res.json() as Promise<{ id?: string }>;
  }, {} as { id?: string });
}

export async function fetchAlbumFirstTrack(token: string, albumId: string) {
  return spotifyFetch(async () => {
    const res = await fetch(`${BASE}/albums/${encodeURIComponent(albumId)}/tracks?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    const data = await res.json() as { items?: Array<{ uri?: string }> };
    return {
      uri: data.items?.[0]?.uri ?? null,
      offsetPosition: 0,
    } as { uri: string | null; offsetPosition: number | null };
  }, {
    uri: null,
    offsetPosition: null,
  });
}

export async function fetchPlaylistFirstTrack(token: string, playlistId: string) {
  const cached = playlistFirstTrackCache.get(playlistId);
  if (cached) {
    return cached;
  }

  const inFlight = playlistFirstTrackInFlight.get(playlistId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const res = await fetch(`${BASE}/playlists/${encodeURIComponent(playlistId)}/items?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        if (!playlistForbiddenLogged.has(playlistId)) {
          console.log('[REWIND.FM] playlist enrichment forbidden, falling back to context-only:', { playlistId });
          playlistForbiddenLogged.add(playlistId);
        }
        const fallback = { uri: null, offsetPosition: null };
        playlistFirstTrackCache.set(playlistId, fallback);
        return fallback;
      }

      if (!res.ok) {
        console.log('[REWIND.FM] playlist enrichment unavailable, using context-only:', {
          playlistId,
          status: res.status,
        });
        const fallback = { uri: null, offsetPosition: null };
        playlistFirstTrackCache.set(playlistId, fallback);
        return fallback;
      }

      const data = await res.json() as {
        items?: Array<{
          track?: { uri?: string } | null;
        }>;
      };

      const result = {
        uri: data.items?.[0]?.track?.uri ?? null,
        offsetPosition: data.items?.[0]?.track?.uri ? 0 : null,
      };

      if (result.uri) {
        console.log('[REWIND.FM] playlist enrichment succeeded:', { playlistId, trackUri: result.uri });
      } else {
        console.log('[REWIND.FM] playlist enrichment found no playable item, using context-only:', { playlistId });
      }

      playlistFirstTrackCache.set(playlistId, result);
      return result;
    } catch {
      const fallback = { uri: null, offsetPosition: null };
      playlistFirstTrackCache.set(playlistId, fallback);
      return fallback;
    } finally {
      playlistFirstTrackInFlight.delete(playlistId);
    }
  })();

  playlistFirstTrackInFlight.set(playlistId, request);
  return request;
}

export async function seekToPosition(token: string, positionMs: number) {
  await spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/player/seek?position_ms=${positionMs}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw toSpotifyError(res.status);
    }
    return undefined;
  }, undefined);
}

export async function transferPlaybackToDevice(token: string, deviceId: string, play = false) {
  await spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/player`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    return undefined;
  }, undefined);
}

export async function playOnDevice(token: string, deviceId: string) {
  await spotifyFetch(async () => {
    const res = await fetch(`${BASE}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      throw toSpotifyError(res.status);
    }

    return undefined;
  }, undefined);
}

export async function startPlaybackOnDevice(
  token: string,
  deviceId: string,
  target: {
    contextUri?: string | null;
    trackUris?: string[];
    offset?: { position?: number; uri?: string } | null;
  }
) {
  try {
    const body: Record<string, unknown> = {};
    const trimmedTrackUris = (target.trackUris ?? []).filter((uri) => !!uri);

    if (target.contextUri) {
      body.context_uri = target.contextUri;
      if (target.offset) {
        body.offset = target.offset;
      }
    } else if (trimmedTrackUris.length > 0) {
      body.uris = trimmedTrackUris;
    }

    const res = await fetch(`${BASE}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseBody = await parseSpotifyResponseBody(res);
    console.log('[REWIND.FM] startPlaybackOnDevice request:', {
      device_id: deviceId,
      payload: body,
    });
    console.log('[REWIND.FM] startPlaybackOnDevice response:', {
      status: res.status,
      body: responseBody,
    });

    if (res.status === 401) {
      localStorage.removeItem('spotify_token');
      window.location.href = '/';
      return {
        ok: false,
        status: res.status,
        body: responseBody,
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      body: responseBody,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: err,
    };
  }
}
