const socketAuth = require('../middlewares/socketAuth');
const registerChatHandler = require('./chat.handler');
const registerPresenceHandler = require('./presence.handler');

function initializeSockets(io) {
    // 1. Authenticate every incoming socket connection during handshake
    io.use(socketAuth);

    // 2. Attach connection lifecycle
    io.on('connection', (socket) => {
        // Register presence & status tracking
        registerPresenceHandler(io, socket);

        // Register 1-on-1 private messaging, typing, seen events
        registerChatHandler(io, socket);
    });
}

module.exports = initializeSockets;
