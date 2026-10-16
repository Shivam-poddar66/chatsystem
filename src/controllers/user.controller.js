const User = require('../models/User');
const presenceService = require('../services/presence.service');

class UserController {
    static async getUsers(req, res) {
        try {
            const currentUserId = req.user.id;
            const users = await User.getAllExcept(currentUserId);

            // Enrich with live real-time presence from memory
            const enrichedUsers = users.map((u) => ({
                ...u,
                status: presenceService.isUserOnline(u.id) ? 'online' : 'offline',
            }));

            return res.json({
                success: true,
                data: enrichedUsers,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch users',
            });
        }
    }
}

module.exports = UserController;
