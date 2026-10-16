require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const initializeSockets = require('./sockets');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Initialize socket authentication and event handlers
initializeSockets(io);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Chat Server running at http://localhost:${PORT}`);
    console.log(`📡 WebSocket Gateway ready on port ${PORT}`);
});
