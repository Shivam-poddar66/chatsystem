const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_chat_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
    static generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    static async register({ name, email, phone, password }) {
        const existing = await User.findByEmail(email);
        if (existing) {
            throw new Error('An account with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a random dicebear avatar based on name
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            avatar,
        });

        const token = this.generateToken(user);
        return { user, token };
    }

    static async login(email, password) {
        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        const token = this.generateToken(user);
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            status: user.status,
            last_seen_at: user.last_seen_at,
        };

        return { user: safeUser, token };
    }

    static verifyToken(token) {
        return jwt.verify(token, JWT_SECRET);
    }
}

module.exports = AuthService;
