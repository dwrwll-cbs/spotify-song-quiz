# 🎵 SongQuiz — Multiplayer Spotify Music Quiz

Quiz de músicas multiplayer com playlists do Spotify. Ouça trechos, adivinhe a música e o artista, ganhe pontos pela velocidade!

---

## 🚀 Funcionalidades

- **Importar playlists do Spotify** (API oficial + fallback iTunes)
- **Configuração customizada**: duração do trecho (1-30s), tempo de resposta (30-120s), posição aleatória
- **Multiplayer em tempo real** com salas e convite por link/código
- **Pontuação separada** para título e artista
- **Loop de áudio** durante a rodada
- **Modo Festa**: som apenas no host
- **Interface responsiva** com tema Spotify

---

## 🛠️ Setup

### Pré-requisitos

- Node.js 18+
- Credenciais da API do Spotify (opcional — funciona sem com playlist demo)

### 1. Obter credenciais do Spotify (opcional)

1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crie um app
3. Copie `Client ID` e `Client Secret`

### 2. Instalar dependências

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configurar variáveis de ambiente

**Server** — crie `server/.env`:
```env
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
PORT=3001
```

**Client** — crie `client/.env`:
```env
VITE_SERVER_URL=http://localhost:3001
```

### 4. Executar

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Abra `http://localhost:5173`

---

## 🌐 Deploy

### Frontend (Vercel)

1. No Vercel, aponte o root para `client/`
2. Adicione a variável `VITE_SERVER_URL` com a URL do backend

### Backend (Render / Railway)

1. Aponte o root para `server/`
2. Build command: `npm install`
3. Start command: `npm start`
4. Adicione as env vars do Spotify

> ⚠️ **Vercel não suporta WebSockets.** O backend (Socket.IO) precisa ficar num serviço que suporte conexões persistentes.

---

## 🎮 Como Jogar

1. Crie uma sala e cole o link de uma playlist do Spotify
2. Compartilhe o código/link com seus amigos
3. Configure: quantas músicas, duração do trecho, tempo de resposta
4. Ouça o trecho e adivinhe a música e/ou artista
5. Pontuação baseada na velocidade — acertar rápido = mais pontos
6. Placar ao vivo durante a partida
7. Resultado final com classificação

---

## Stack

- **Frontend**: React + Vite + Lucide Icons + Canvas Confetti
- **Backend**: Express + Socket.IO
- **API**: Spotify Web API (Client Credentials) + iTunes Search fallback
