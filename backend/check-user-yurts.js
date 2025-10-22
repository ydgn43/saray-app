// Check user-yurt assignments
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkUserYurtAssignments() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'SarayDb'
    });

    console.log('✅ Connected to database\n');

    try {
        // Get all users with admin or super-admin role
        const [admins] = await connection.query(`
            SELECT accountid, username, role, yurtid 
            FROM User 
            WHERE role IN ('admin', 'super-admin')
        `);

        console.log('👥 Admin users:');
        admins.forEach(admin => {
            console.log(`   - ${admin.username} (${admin.role}) - accountid: ${admin.accountid}, yurtid: ${admin.yurtid}`);
        });

        console.log('\n🔗 UserYurt assignments:');
        const [assignments] = await connection.query(`
            SELECT 
                uy.user_yurt_id,
                uy.accountid,
                u.username,
                u.role,
                uy.yurtid,
                y.yurt_name,
                uy.is_primary,
                uy.assigned_at
            FROM UserYurt uy
            JOIN User u ON uy.accountid = u.accountid
            JOIN Yurt y ON uy.yurtid = y.yurtid
            WHERE u.role IN ('admin', 'super-admin')
            ORDER BY u.username, uy.is_primary DESC
        `);

        if (assignments.length === 0) {
            console.log('   ❌ NO ASSIGNMENTS FOUND!');
            console.log('   This is the problem - admins need to be assigned to yurts in the UserYurt table.\n');
        } else {
            assignments.forEach(assign => {
                const primary = assign.is_primary ? '⭐ PRIMARY' : '';
                console.log(`   - ${assign.username}: ${assign.yurt_name} ${primary}`);
            });
        }

        console.log('\n🏢 All yurts:');
        const [yurts] = await connection.query('SELECT * FROM Yurt');
        yurts.forEach(yurt => {
            console.log(`   - ${yurt.yurt_name} (ID: ${yurt.yurtid}) - ${yurt.is_active ? 'Active' : 'Inactive'}`);
        });

        // Check if there are admins without UserYurt assignments
        console.log('\n🔍 Checking for admins without UserYurt assignments...');
        const [unmappedAdmins] = await connection.query(`
            SELECT u.accountid, u.username, u.role, u.yurtid
            FROM User u
            WHERE u.role IN ('admin', 'super-admin')
            AND NOT EXISTS (
                SELECT 1 FROM UserYurt uy WHERE uy.accountid = u.accountid
            )
        `);

        if (unmappedAdmins.length > 0) {
            console.log('   ⚠️  Found admins without UserYurt assignments:');
            unmappedAdmins.forEach(admin => {
                console.log(`      - ${admin.username} (accountid: ${admin.accountid}, yurtid: ${admin.yurtid})`);
            });
            console.log('\n   💡 FIX: Run this SQL to assign them to their yurts:');
            unmappedAdmins.forEach(admin => {
                console.log(`      INSERT INTO UserYurt (accountid, yurtid, is_primary, assigned_by, assigned_at) VALUES (${admin.accountid}, ${admin.yurtid}, 1, ${admin.accountid}, NOW());`);
            });
        } else {
            console.log('   ✅ All admins have UserYurt assignments');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkUserYurtAssignments();
