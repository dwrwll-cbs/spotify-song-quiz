import axios from 'axios';

let cachedToken = null;
let tokenExpiresAt = 0;

// Extract Playlist ID from URL, URI, or ID string
export function parsePlaylistId(input) {
  if (!input) return null;
  const str = input.trim();
  
  // Direct ID
  if (/^[a-zA-Z0-9]{22}$/.test(str)) {
    return str;
  }
  
  // Spotify URI: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const uriMatch = str.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
  if (uriMatch) return uriMatch[1];
  
  // Spotify URL: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  const urlMatch = str.match(/playlist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  return null;
}

// Get Spotify API Access Token (Client Credentials Flow)
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET non defined in .env file.');
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`
      }
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
  return cachedToken;
}

// Fallback to fetch preview audio url from iTunes Search API if Spotify returns null preview_url
async function fetchiTunesAudioPreview(artist, title) {
  try {
    const query = `${artist} ${title}`.replace(/[\(\)\[\]]/g, '');
    const res = await axios.get(`https://itunes.apple.com/search`, {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 1
      },
      timeout: 3000
    });
    if (res.data?.results?.length > 0 && res.data.results[0].previewUrl) {
      return res.data.results[0].previewUrl;
    }
  } catch (err) {
    // ignore iTunes fallback errors
  }
  return null;
}

// Fetch tracks from Spotify Playlist
export async function getPlaylistTracks(playlistId) {
  const token = await getSpotifyToken();

  // 1. Get playlist metadata
  let playlistName = 'Spotify Playlist';
  let playlistImage = null;
  try {
    const metaRes = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    playlistName = metaRes.data.name || playlistName;
    playlistImage = metaRes.data.images?.[0]?.url || null;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error('Playlist não encontrada no Spotify. Verifique se o link está correto e a playlist é pública.');
    }
    throw new Error('Erro ao acessar a API do Spotify: ' + (err.response?.data?.error?.message || err.message));
  }

  // 2. Fetch tracks (up to 100)
  const tracksRes = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 100, fields: 'items(track(id,name,artists,album,preview_url))' }
  });

  const rawTracks = tracksRes.data.items || [];
  const validTracks = [];

  for (const item of rawTracks) {
    const track = item.track;
    if (!track || !track.name || !track.artists || track.artists.length === 0) continue;

    const mainArtist = track.artists.map(a => a.name).join(', ');
    let previewUrl = track.preview_url;

    // iTunes fallback if Spotify preview_url is missing
    if (!previewUrl) {
      previewUrl = await fetchiTunesAudioPreview(track.artists[0].name, track.name);
    }

    if (previewUrl) {
      validTracks.push({
        id: track.id || `track-${Math.random().toString(36).substr(2, 9)}`,
        title: track.name,
        artist: mainArtist,
        albumCover: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || playlistImage || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
        previewUrl: previewUrl
      });
    }
  }

  return {
    id: playlistId,
    name: playlistName,
    image: playlistImage,
    tracks: validTracks,
    totalFound: validTracks.length
  };
}
