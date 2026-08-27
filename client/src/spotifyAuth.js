// Spotify Authorization Code Flow with PKCE
// All auth happens client-side — no secrets exposed

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

const SCOPES = 'playlist-read-private playlist-read-collaborative user-read-private user-read-email';

// Spotify não aceita "localhost" como redirect — usar 127.0.0.1 em dev
function getRedirectUri() {
  const origin = window.location.origin;
  if (origin.includes('localhost')) {
    return origin.replace('localhost', '127.0.0.1') + '/callback';
  }
  return origin + '/callback';
}

function getClientId() {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
}

// ============ PKCE Helpers ============

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

// ============ Auth Flow ============

export async function loginWithSpotify() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID não configurado');
  }

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier for callback exchange — use sessionStorage (not localStorage) for security
  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'false'
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    throw new Error(`Spotify auth error: ${error}`);
  }

  if (!code) {
    throw new Error('No authorization code received');
  }

  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found — try logging in again');
  }

  // Exchange code for token
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error_description || 'Failed to exchange token');
  }

  const tokenData = await response.json();

  // Clean up
  sessionStorage.removeItem('spotify_code_verifier');

  // Store tokens
  const authData = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    scope: tokenData.scope
  };

  localStorage.setItem('spotify_auth', JSON.stringify(authData));

  // Clean URL
  window.history.replaceState({}, document.title, '/');

  return authData;
}

export async function refreshSpotifyToken() {
  const stored = getStoredAuth();
  if (!stored?.refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'refresh_token',
      refresh_token: stored.refreshToken
    })
  });

  if (!response.ok) {
    // Refresh failed — force re-login
    logoutSpotify();
    throw new Error('Token refresh failed — please login again');
  }

  const tokenData = await response.json();

  const authData = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || stored.refreshToken,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    scope: tokenData.scope
  };

  localStorage.setItem('spotify_auth', JSON.stringify(authData));
  return authData;
}

// ============ Token Management ============

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem('spotify_auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getValidToken() {
  const stored = getStoredAuth();
  if (!stored) return null;

  // Refresh if within 5 min of expiry
  if (Date.now() >= stored.expiresAt - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshSpotifyToken();
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return stored.accessToken;
}

export function isLoggedIn() {
  const stored = getStoredAuth();
  return !!stored?.accessToken;
}

export function logoutSpotify() {
  localStorage.removeItem('spotify_auth');
}

// ============ Spotify API Calls ============

async function spotifyFetch(endpoint, token) {
  const res = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    // Token expired — try refresh
    const refreshed = await refreshSpotifyToken();
    const retryRes = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${refreshed.accessToken}` }
    });
    if (!retryRes.ok) throw new Error('Spotify API error after refresh');
    return retryRes.json();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Spotify API error');
  }

  return res.json();
}

export async function getSpotifyUser() {
  const token = await getValidToken();
  if (!token) return null;
  return spotifyFetch('/me', token);
}

export async function getUserPlaylists(limit = 50, offset = 0) {
  const token = await getValidToken();
  if (!token) return null;
  return spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`, token);
}
