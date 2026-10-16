const presenceService = require('../services/presence.service');

module.exports = function registerPresenceHandler(io, socket) {
    const userId = socket.user.id;

    // Join the user's private channel room
    socket.join(`user_${userId}`);

    // Register active connection
    (async () => {
        const becameOnline = await presenceService.addConnection(userId, socket.id);
        if (becameOnline) {
            // Broadcast to all clients that this user is now online
            io.emit('user:status_changed', {
                userId,
                status: 'online',
                lastSeen: null,
            });
        }
    })();

    // Handle user disconnect
    socket.on('disconnect', async () => {
        const wentOffline = await presenceService.removeConnection(userId, socket.id);
        if (wentOffline) {
            // Broadcast to all clients that this user has gone offline
            io.emit('user:status_changed', {
                userId,
                status: 'offline',
                lastSeen: new Date().toISOString(),
            });
        }
    });
};
