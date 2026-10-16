const AuthService = require('../services/auth.service');

function socketAuth(socket, next) {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication failed: Missing token'));
        }

        const decoded = AuthService.verifyToken(token);
        // Attach verified user payload to the socket instance
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication failed: Invalid or expired token'));
    }
}

module.exports = socketAuth;
