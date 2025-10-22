// Quick script to verify if UserYurt table exists
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function verifyMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'SarayDb'
    });

    console.log('✅ Connected to database');

    try {
        // Check if UserYurt table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'UserYurt'"
        );

        if (tables.length === 0) {
            console.log('❌ UserYurt table does NOT exist!');
            console.log('⚠️  You need to run the migration:');
            console.log('   MySQL Workbench: Open and execute db\\UserYurtAccess-Migration.sql');
            console.log('   OR run: mysql -u root -p SarayDb < db\\UserYurtAccess-Migration.sql');
            return;
        }

        console.log('✅ UserYurt table exists');

        // Check UserYurt structure
        const [columns] = await connection.query('DESCRIBE UserYurt');
        console.log('\n📋 UserYurt columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        // Check if there are any records
        const [count] = await connection.query('SELECT COUNT(*) as count FROM UserYurt');
        console.log(`\n📊 UserYurt has ${count[0].count} record(s)`);

        // Check AdminSignupRequest table
        const [adminTables] = await connection.query(
            "SHOW TABLES LIKE 'AdminSignupRequest'"
        );

        if (adminTables.length > 0) {
            console.log('✅ AdminSignupRequest table exists');
        } else {
            console.log('❌ AdminSignupRequest table does NOT exist');
        }

        // List all yurts
        const [yurts] = await connection.query('SELECT * FROM Yurt');
        console.log(`\n🏢 Found ${yurts.length} yurt(s):`);
        yurts.forEach(yurt => {
            console.log(`   - ${yurt.yurt_name} (ID: ${yurt.yurtid})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

verifyMigration();
