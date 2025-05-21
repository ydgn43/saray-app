// backend/data/seedUsers.ts
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import bcrypt from 'bcrypt';
import User from './models/User';
import { sequelize } from './sequelize';


async function createUsers() {
    // Connect to DB (if not already)
    await sequelize.sync();

    // Roles must exist beforehand. Make sure they are in your Role table.
    const roles = ['admin', 'hoca', 'yoklamaci'];

    // Example users
    const users = [
        {
            username: 'admin_test',
            password: 'adminpass',   // Plain password for seeding only
            role_name: 'admin'
        },
        {
            username: 'hoca_test',
            password: 'hocapass',
            role_name: 'hoca'
        },
        {
            username: 'yoklamaci_test',
            password: 'yoklamacipass',
            role_name: 'yoklamaci'
        }
    ];

    for (const user of users) {
        // Check if user already exists
        const exists = await User.findOne({ where: { username: user.username } });
        if (exists) {
            console.log(`User ${user.username} already exists, skipping.`);
            continue;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Create the user
        await User.create({
            username: user.username,
            password: hashedPassword,
            role_name: user.role_name
        });

        console.log(`Created user: ${user.username}`);
    }

    process.exit(0);
}

createUsers().catch((err) => {
    console.error(err);
    process.exit(1);
});
