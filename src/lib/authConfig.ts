export function getSpotifyRedirectUri() {
  const runtimeUri = new URL(`${import.meta.env.BASE_URL}callback`, window.location.origin).toString();
  const configuredUri = import.meta.env.VITE_REDIRECT_URI;

  // In dev environments (localhost/Codespaces), stale env values are common.
  // Prefer the live origin callback so auth always returns to the current app URL.
  if (import.meta.env.DEV) {
    return runtimeUri;
  }

  return configuredUri || runtimeUri;
}
