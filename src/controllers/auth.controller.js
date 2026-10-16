const AuthService = require('../services/auth.service');
const User = require('../models/User');

class AuthController {
    static async register(req, res) {
        try {
            const { name, email, phone, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, and password are required',
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long',
                });
            }

            const result = await AuthService.register({ name, email, phone, password });
            return res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required',
                });
            }

            const result = await AuthService.login(email, password);
            return res.json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message || 'Authentication failed',
            });
        }
    }

    static async me(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.json({ success: true, data: user });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = AuthController;
