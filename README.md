# REWIND.FM

Retro cassette-and-vinyl Spotify player built with React, Vite, TypeScript, CSS Modules, and Zustand.

## Features

- Spotify OAuth 2.0 with PKCE flow
- Spotify Web Playback SDK integration
- Cassette library UI with skeleton loading state
- Turntable and tape reel animations tied to playback state
- Demo mode with built-in default tracks when Spotify is not connected
- Responsive two-panel layout that stacks on mobile

## Stack

- React + Vite + TypeScript
- Zustand for player state
- Spotify Web API + Web Playback SDK
- CSS Modules
- Google Fonts: Bebas Neue and Space Mono

## Prerequisites

- Node.js 20+
- npm 10+
- Spotify Premium account (required for Web Playback SDK)

## Local Setup

1. Install dependencies:

	npm install

2. Create an environment file from the template:

	cp .env.example .env

3. Fill in .env values:

	VITE_SPOTIFY_CLIENT_ID=your_client_id_here
	VITE_REDIRECT_URI=http://localhost:5173/callback

4. Start development server:

	npm run dev

5. Build production bundle:

	npm run build

## Spotify Dashboard Configuration

1. Open Spotify Developer Dashboard and create an app.
2. Copy your Client ID into VITE_SPOTIFY_CLIENT_ID.
3. In app settings, add this Redirect URI:

	http://localhost:5173/callback

4. Save changes in Spotify dashboard.
5. Restart the Vite dev server after editing environment values.

## GitHub Pages Deployment

This project is configured for repository-based GitHub Pages deployment.

Expected Pages URL:

	https://adarshalexbalmuchu.github.io/Rewind.fm/

Required Spotify Redirect URI for Pages:

	https://adarshalexbalmuchu.github.io/Rewind.fm/callback

Add both redirect URIs in Spotify Developer Dashboard:

	http://localhost:5173/callback
	https://adarshalexbalmuchu.github.io/Rewind.fm/callback

Deployment commands:

	npm install
	npm run deploy

What these scripts do:

- `build:pages` builds with `VITE_BASE_PATH=/Rewind.fm/`, injects `VITE_REDIRECT_URI=https://adarshalexbalmuchu.github.io/Rewind.fm/callback`, and creates `dist/404.html` for SPA fallback on GitHub Pages.
- `deploy` publishes `dist` to GitHub Pages via `gh-pages`.

## How It Works

- Not connected mode:
  Uses a built-in default tape library and local playback ticker.

- Connected mode:
  Loads saved albums and playlists from Spotify and drives playback state from the SDK.

## Project Structure

- src/components: UI blocks for header, tape library, player panel, and stripe accents
- src/hooks: auth, SDK wrapper, and playback ticking
- src/lib: PKCE, Spotify API helpers, and cassette style mapping
- src/pages: main app and OAuth callback page
- src/store: Zustand player store

## Notes

- The overlay message INSERT TAPE TO BEGIN does not block interaction.
- Mobile layout stacks library above player and limits library height for scrolling.

## Spotify Setup Notes

- This app runs in Development Mode by default.
- Only users added in your Spotify Developer Dashboard can log in.
- Playback requires a Spotify Premium account.
- If playback fails, the app enters Demo Mode automatically and the UI remains usable with sample library data.
- Public access may require Spotify approval or expanded access, depending on current platform limits.