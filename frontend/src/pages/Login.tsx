import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { a } from 'framer-motion/dist/types.d-CtuPurYT';
import { authFetch } from '../utils/authFetch';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await authFetch('http://192.168.50.120:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            const data = await res.json();
            login(data.user, data.token);
            navigate('/'); // Redirect after login
        } else {
            const data = await res.json();
            setError(data.message || 'Login failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
            <form onSubmit={handleSubmit}>
                <h2 className="mb-4">Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <input
                    className="form-control mb-2"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                />
                <input
                    className="form-control mb-2"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button className="btn btn-primary w-100" type="submit">Login</button>
            </form>
        </div>
    );
}

