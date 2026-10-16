const AuthService = require('../services/auth.service');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Missing or invalid token',
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Token is expired or invalid',
        });
    }
}

module.exports = authMiddleware;
