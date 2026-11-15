// One-time setup: creates the instance's first yurt and its first admin account
// (and, optionally, a super-admin account that can later add more yurts and accounts).
//
// Run from the repository folder:
//   node deploy/tools/create-first-admin.js --yurt "My Yurt" --admin admin1 [--super-admin ahmet] [--timezone Europe/Berlin]
//
// Passwords are asked for on screen (hidden). For automation they can be given
// through the environment: ADMIN_PASSWORD and SUPER_ADMIN_PASSWORD.
//
// It refuses to run if a yurt already exists, so it cannot damage a database in use.
// It reads the database settings from backend/config.env and creates NO students or other data.

const path = require('path');
const readline = require('readline');

const backendDir = path.resolve(__dirname, '..', '..', 'backend');
const req = (name) => require(path.join(backendDir, 'node_modules', name));
const dotenv = req('dotenv');
const bcrypt = req('bcrypt');
const mysql = req('mysql2/promise');

dotenv.config({ path: path.join(backendDir, 'config.env') });

function arg(name) {
    const i = process.argv.indexOf('--' + name);
    return i !== -1 ? process.argv[i + 1] : undefined;
}

function askHidden(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
        rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    });
}

async function getPassword(label, envName) {
    let pw = process.env[envName];
    if (!pw) {
        pw = await askHidden(`Password for ${label} (min 10 characters): `);
        const again = await askHidden('Repeat password: ');
        if (pw !== again) throw new Error('The two passwords are not the same.');
    }
    if (pw.length < 10) throw new Error('Password must be at least 10 characters.');
    return pw;
}

async function main() {
    const yurtName = arg('yurt');
    const adminName = arg('admin');
    const superName = arg('super-admin');
    const timezone = arg('timezone') || 'Europe/Berlin';
    if (!yurtName || !adminName) {
        console.error('Usage: node deploy/tools/create-first-admin.js --yurt "Yurt name" --admin <username> [--super-admin <username>] [--timezone Europe/Berlin]');
        process.exit(1);
    }
    if (superName && superName === adminName) throw new Error('--admin and --super-admin must be different usernames.');

    const adminPw = await getPassword(`admin "${adminName}"`, 'ADMIN_PASSWORD');
    const superPw = superName ? await getPassword(`super-admin "${superName}"`, 'SUPER_ADMIN_PASSWORD') : null;

    const conn = await mysql.createConnection({
        host: process.env.HOST_RELATIONAL_DB || process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.PORT_RELATIONAL_DB || process.env.DB_PORT || 3306),
        user: process.env.USER_RELATIONAL_DB || process.env.DB_USER,
        password: process.env.PASSWORD_RELATIONAL_DB || process.env.DB_PASSWORD,
        database: process.env.SCHEMA_RELATIONAL_DB || process.env.DB_NAME
    });

    try {
        const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM yurt');
        if (n > 0) throw new Error('This database already has a yurt. Nothing was changed.');

        await conn.beginTransaction();

        const [y] = await conn.query(
            'INSERT INTO yurt (yurt_name, timezone, is_active, created_at) VALUES (?, ?, 1, NOW())',
            [yurtName, timezone]
        );
        const yurtid = y.insertId;

        const adminHash = await bcrypt.hash(adminPw, 10);
        const [a] = await conn.query(
            "INSERT INTO `user` (username, password, role_name, yurtid) VALUES (?, ?, 'admin', ?)",
            [adminName, adminHash, yurtid]
        );
        await conn.query(
            'INSERT INTO useryurt (accountid, yurtid, is_primary, assigned_at) VALUES (?, ?, 1, NOW())',
            [a.insertId, yurtid]
        );

        if (superName) {
            const superHash = await bcrypt.hash(superPw, 10);
            const [s] = await conn.query(
                "INSERT INTO `user` (username, password, role_name, yurtid) VALUES (?, ?, 'super-admin', ?)",
                [superName, superHash, yurtid]
            );
            await conn.query(
                'INSERT INTO useryurt (accountid, yurtid, is_primary, assigned_at, assigned_by) VALUES (?, ?, 1, NOW(), ?)',
                [s.insertId, yurtid, String(a.insertId)]
            );
        }

        // Same default lists the main yurt has (they can be changed in Settings afterwards).
        for (const t of ['var', 'yok', 'gec', 'izinli']) {
            await conn.query(
                'INSERT INTO attendancetype (attendance_type_name, type_name, yurtid, is_active) VALUES (?, ?, ?, 1)',
                [t, t, yurtid]
            );
        }
        const reasons = ['Banyo', 'Hasta', 'Rahatsiz', 'Okul'];
        for (let i = 0; i < reasons.length; i++) {
            await conn.query(
                'INSERT INTO attendance_reasons (yurtid, name, sort_order) VALUES (?, ?, ?)',
                [yurtid, reasons[i], i + 1]
            );
        }

        await conn.commit();
        console.log(`Done. Yurt "${yurtName}" (id ${yurtid}) created with admin "${adminName}"` +
            (superName ? ` and super-admin "${superName}".` : '.'));
    } catch (e) {
        try { await conn.rollback(); } catch (_) { /* nothing to roll back */ }
        throw e;
    } finally {
        await conn.end();
    }
}

main().catch((e) => { console.error('ERROR: ' + e.message); process.exit(1); });
