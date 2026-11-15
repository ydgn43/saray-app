// Settings that differ between the main server and a separately hosted instance.
// Every value falls back to what the app used before, so nothing changes unless
// the matching line is added to config.env.

// Origins (browser addresses) that may call the API.
// ALLOWED_ORIGINS="https://my-laptop.tailnet.ts.net,http://localhost:3000"  (comma separated)
// If it is not set, the original built-in list is used.
const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://192.168.50.238:3000',
    'https://app.efendim.nl',
    'https://api.efendim.nl'
];

export function getAllowedOrigins(): string[] {
    const fromEnv = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    return fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

// SERVE_FRONTEND=true makes the backend also serve the built React app,
// so one address (and one tunnel) is enough.
export function isServingFrontend(): boolean {
    return (process.env.SERVE_FRONTEND || '').toLowerCase() === 'true';
}

// Values that must never be used as a real secret in hosting mode.
const WEAK_SECRETS = ['', 'supersecretkey', 'saray-app', 'change-me', 'changeme'];

export function assertStrongJwtSecret(): void {
    const secret = process.env.JWT_SECRET || '';
    if (WEAK_SECRETS.includes(secret.toLowerCase()) || secret.length < 32) {
        console.error(
            'FATAL: SERVE_FRONTEND=true requires a random JWT_SECRET of at least 32 characters in config.env.'
        );
        process.exit(1);
    }
}
