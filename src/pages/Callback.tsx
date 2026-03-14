import { useEffect } from 'react';
import { spotifyFetch } from '../lib/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || new URL(`${import.meta.env.BASE_URL}callback`, window.location.origin).toString();

export function Callback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const verifier = localStorage.getItem('pkce_verifier');

    if (code && verifier) {
      spotifyFetch(
        async () => {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: REDIRECT_URI,
              client_id: CLIENT_ID,
              code_verifier: verifier,
            }),
          });

          if (!response.ok) {
            throw { status: response.status };
          }

          return response.json();
        },
        {}
      )
        .then((data) => {
          const payload = data as {
            access_token?: string;
            expires_in?: number;
            refresh_token?: string;
          };

          if (payload.access_token && payload.expires_in) {
            localStorage.setItem('spotify_token', payload.access_token);
            localStorage.setItem('spotify_token_expiry', String(Date.now() + payload.expires_in * 1000));
            if (payload.refresh_token) {
              localStorage.setItem('spotify_refresh_token', payload.refresh_token);
            }
          }
          window.location.href = import.meta.env.BASE_URL;
        });
    }
  }, []);

  return (
    <div
      style={{
        background: '#0e0b07',
        color: '#ede0bb',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Space Mono, monospace',
        fontSize: '12px',
        letterSpacing: '0.2em',
      }}
    >
      AUTHENTICATING...
    </div>
  );
}
