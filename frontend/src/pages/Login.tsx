import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { motion } from 'framer-motion';
import { PersonCircle } from 'react-bootstrap-icons';
import { authFetch } from '../utils/authFetch';
import logo from '../images/logo.png';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authFetch('https://localhost:3001/auth/login', {
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
        } catch (err) {
            setError('Sunucuya erişilemedi!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(120deg, #59b4ff 0%, #1863ae 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <motion.div
                className="shadow-lg bg-white p-4 rounded-4"
                initial={{ opacity: 0, y: 60, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
                style={{
                    minWidth: 340,
                    width: '100%',
                    maxWidth: 380,
                    boxShadow: '0 10px 24px rgba(24, 99, 174, 0.12)',
                    border: '1px solid #e8eaf6',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img src={logo} alt="User Icon" style={{ width: 60, height: 60, color: "#1863ae" }} className="mb-1" />
                </div>
                <h2 className="fw-bold mb-2 text-primary text-center">Efendim! Giriş</h2>
                <form onSubmit={handleSubmit} autoComplete="on">
                    <motion.input
                        className="form-control mb-3"
                        placeholder="Kullanıcı adı"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoFocus
                        disabled={loading}
                        whileFocus={{ scale: 1.02, borderColor: "#59b4ff" }}
                    />
                    <motion.input
                        className="form-control mb-3"
                        type="password"
                        placeholder="Şifre"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                        whileFocus={{ scale: 1.02, borderColor: "#59b4ff" }}
                    />
                    <motion.button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-semibold"
                        whileHover={{ scale: 1.03, backgroundColor: "#1a73e8" }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Giriş yapılıyor...
                            </span>
                        ) : (
                            'Giriş Yap'
                        )}
                    </motion.button>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: error ? 1 : 0, y: error ? 0 : 8 }}
                        className="alert alert-danger mt-3 mb-0 py-2"
                        style={{ fontSize: 15, minHeight: 38, pointerEvents: 'none', borderRadius: 8 }}
                    >
                        {error}
                    </motion.div>
                </form>
            </motion.div>
        </div>
    );
}
