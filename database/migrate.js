const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Running Database Migrations...');
    
    // Connect first without database in case it needs to be created
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
    });

    try {
        const sqlPath = path.join(__dirname, 'migrations/001_initial_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await connection.query(sql);
        console.log('✅ Migrations executed successfully! Database and tables created.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = runMigration;
