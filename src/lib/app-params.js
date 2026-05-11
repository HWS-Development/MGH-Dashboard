/**
 * App params stub - replaces the Base44 app-params.
 * No longer needed with Laravel backend, but kept to avoid import errors
 * in any remaining code that references it.
 */
export const appParams = {
  appId: 'mgh-dashboard',
  token: null,
  fromUrl: window.location.href,
  functionsVersion: null,
  appBaseUrl: window.location.origin,
};
