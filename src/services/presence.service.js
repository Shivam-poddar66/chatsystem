const User = require('../models/User');

class PresenceService {
    constructor() {
        // Map<userId, Set<socketId>>
        this.onlineUsers = new Map();
    }

    /**
     * Records a socket connection for a user.
     * Returns true if user was previously offline (just came online).
     */
    async addConnection(userId, socketId) {
        const id = parseInt(userId, 10);
        let sockets = this.onlineUsers.get(id);
        const wasOffline = !sockets || sockets.size === 0;

        if (!sockets) {
            sockets = new Set();
            this.onlineUsers.set(id, sockets);
        }
        sockets.add(socketId);

        if (wasOffline) {
            try {
                await User.updateStatus(id, 'online');
            } catch (err) {
                console.error(`Failed to update user ${id} status to online:`, err.message);
            }
        }

        return wasOffline;
    }

    /**
     * Removes a socket connection for a user.
     * Returns true if user has no remaining sockets (just went offline).
     */
    async removeConnection(userId, socketId) {
        const id = parseInt(userId, 10);
        const sockets = this.onlineUsers.get(id);

        if (!sockets) return false;

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.onlineUsers.delete(id);
            try {
                const now = new Date();
                await User.updateStatus(id, 'offline', now);
            } catch (err) {
                console.error(`Failed to update user ${id} status to offline:`, err.message);
            }
            return true;
        }

        return false;
    }

    isUserOnline(userId) {
        const id = parseInt(userId, 10);
        const sockets = this.onlineUsers.get(id);
        return Boolean(sockets && sockets.size > 0);
    }

    getOnlineUserIds() {
        return Array.from(this.onlineUsers.keys());
    }
}

// Singleton instance
module.exports = new PresenceService();
