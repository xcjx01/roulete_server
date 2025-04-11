const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());

let gameState = {
  roundId: 1,
  result: null,
  players: [],
  isSpinning: false,
};

function spinRoulette() {
  gameState.isSpinning = true;
  gameState.result = null;

  io.emit('spinning');

  setTimeout(() => {
    const result = Math.floor(Math.random() * 37); // 0 - 36
    gameState.result = result;
    gameState.isSpinning = false;

    io.emit('result', result);
    gameState.roundId += 1;
    gameState.players = [];
  }, 8000); // putar selama 8 detik
}

setInterval(() => {
  if (!gameState.isSpinning) {
    spinRoulette();
  }
}, 10000); // spin otomatis setiap 10 detik

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Kirim status game saat ini ke pemain baru
  socket.emit('gameState', gameState);

  socket.on('placeBet', (bet) => {
    const existing = gameState.players.find(p => p.id === socket.id);
    if (!existing) {
      gameState.players.push({ id: socket.id, bet });
      io.emit('updateBets', gameState.players);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
