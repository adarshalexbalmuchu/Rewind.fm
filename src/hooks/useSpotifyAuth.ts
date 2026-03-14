import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce';
import { getSpotifyRedirectUri } from '../lib/authConfig';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SCOPES = 'streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control playlist-read-private playlist-read-collaborative user-top-read';

export function useSpotifyAuth() {
  const token = localStorage.getItem('spotify_token');
  const isConnected = !!token && !isTokenExpired();

  function isTokenExpired() {
    const expiry = localStorage.getItem('spotify_token_expiry');
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  }

  async function connect() {
    if (!CLIENT_ID) {
      console.error('[REWIND.FM] Missing VITE_SPOTIFY_CLIENT_ID. Add it to your environment and restart the dev server.');
      return;
    }

    const redirectUri = getSpotifyRedirectUri();
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem('pkce_verifier', verifier);
    localStorage.setItem('spotify_redirect_uri', redirectUri);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }

  function getToken() {
    return isConnected ? localStorage.getItem('spotify_token') : null;
  }

  return { isConnected, connect, getToken };
}
