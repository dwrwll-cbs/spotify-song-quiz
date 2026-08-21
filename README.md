# 🎵 Spotify Song Quiz (Multiplayer)

Aplicativo web completo de **quiz de músicas** inspirado em jogos de adivinhar músicas, integrado à API do Spotify com suporte a salas multiplayer em tempo real.

---

## 🚀 Funcionalidades

1. **Importação de Playlists do Spotify**: Busca músicas de qualquer playlist pública via API do Spotify com fallback inteligente via iTunes Search API para garantir áudio de 30s em todas as músicas.
2. **Configuração Customizada de Partida**:
   - Escolha de 5, 10, 15 ou 20 músicas por rodada.
   - Trechos de 5s, 10s, 15s, 20s ou 30s.
   - Posição do áudio (Início vs Aleatório).
   - **Modo Festa / Áudio Apenas no Host**: Opção para o som sair somente no dispositivo do Host.
3. **Multiplayer com Convite em Tempo Real**:
   - Criação de sala com código de 6 dígitos e link de convite (`?room=CÓDIGO`).
   - Placar ao vivo sincronizado via Socket.IO.
   - Sistema de pontuação baseado no tempo de resposta + botão manual "Acertei".
4. **Interface e Estética**:
   - Design moderno com tema dark Spotify neon, glassmorphism e animações.
   - 100% responsivo para celulares e computadores.

---

## 🛠️ Como Instalar e Rodar

### 1. Instalar dependências (Backend e Frontend)

No terminal da pasta `spotify-quiz`:

```bash
# Na pasta server
cd server
npm install

# Na pasta client
cd ../client
npm install
```

### 2. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `.env` na pasta `server/` (baseado no `server/.env.example`):

```env
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
PORT=3001
```

> **Nota:** Se você não configurar as credenciais do Spotify no `.env`, o aplicativo funcionará perfeitamente utilizando a playlist de demonstração integrada.

### 3. Executar o Projeto

**Iniciar o Servidor (Backend):**
```bash
cd server
npm run dev
```

**Iniciar a Aplicação Web (Frontend):**
```bash
cd client
npm run dev
```

Abra o navegador em `http://localhost:5173`. Para testar o multiplayer, abra um segundo navegador ou aba anônima com o link de convite!
