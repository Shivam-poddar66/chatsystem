const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const demoUsers = [
    {
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: '+1 (555) 019-2834',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice',
    },
    {
        name: 'Bob Jones',
        email: 'bob@example.com',
        phone: '+91 9876543210',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bob',
    },
    {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        phone: '0987654321',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Charlie',
    },
    {
        name: 'Diana Prince',
        email: 'diana@example.com',
        phone: '+44 7911 123456',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Diana',
    },
];

async function seed() {
    console.log('🌱 Seeding demo users...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'db_chatsystem',
    });

    try {
        for (const user of demoUsers) {
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE email = ? LIMIT 1',
                [user.email]
            );

            if (existing.length === 0) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await connection.execute(
                    `INSERT INTO users (name, email, phone, password, avatar, status) 
                     VALUES (?, ?, ?, ?, ?, 'offline')`,
                    [user.name, user.email, user.phone, hashedPassword, user.avatar]
                );
                console.log(`👤 Created user: ${user.name} (${user.email})`);
            } else {
                console.log(`ℹ️ User already exists: ${user.name}`);
            }
        }
        console.log('✅ Demo seeding complete! Default password for all users is: password123');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    seed();
}

module.exports = seed;
