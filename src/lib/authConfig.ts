export function getSpotifyRedirectUri() {
  return new URL(`${import.meta.env.BASE_URL}callback`, window.location.origin).toString();
}
