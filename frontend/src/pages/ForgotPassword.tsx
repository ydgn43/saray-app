import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonCircle, ArrowRight, ExclamationCircle,
    CheckCircleFill, ArrowLeft, ShieldLock,
} from 'react-bootstrap-icons';
import config from '../config';
import logo from '../images/logo.png';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${config.API_BASE_URL}/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (res.ok && data.requestSubmitted) {
                setSuccess(true);
                toast.success('Talebiniz alındı!');
            } else {
                setError(data.message || 'Bir hata oluştu');
            }
        } catch {
            setError('Sunucuya erişilemedi!');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        paddingLeft: '48px',
        height: '52px',
        border: focusedField === field ? '1.5px solid #22c55e' : '1.5px solid #e5e7eb',
        borderRadius: '14px',
        fontSize: '15px',
        transition: 'all 0.2s',
        backgroundColor: '#f9fafb',
        outline: 'none',
        width: '100%',
        color: '#111827',
    });

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    width: '100%', maxWidth: '460px',
                    background: '#ffffff', borderRadius: '24px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '48px 44px' }}>

                    {/* Back Link */}
                    <Link to="/login" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: '#22c55e', fontSize: '13px', fontWeight: '500',
                        textDecoration: 'none', marginBottom: '24px',
                    }}>
                        <ArrowLeft size={14} /> Giriş sayfasına dön
                    </Link>

                    {/* Logo + Headline */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <img src={logo} alt="Logo" style={{ width: '22px', height: '22px', filter: 'brightness(0) invert(1)' }} />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#6b7280' }}>Efendim App</span>
                        </div>
                        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
                            {success ? 'Talebiniz Alındı ✅' : 'Şifremi Unuttum'}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                            {success
                                ? 'Yöneticiniz size bir sıfırlama kodu paylaşacak.'
                                : 'Kullanıcı adınızı girin, sıfırlama talebinde bulunun.'}
                        </p>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Success Icon */}
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #86efac, #22c55e)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px',
                                        boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
                                    }}
                                >
                                    <CheckCircleFill color="white" size={36} />
                                </motion.div>
                            </div>

                            {/* Info box */}
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: '#f0fdf4',
                                border: '1.5px solid #bbf7d0',
                                marginBottom: '24px',
                            }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <ShieldLock color="#16a34a" size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '600', margin: '0 0 4px 0' }}>
                                            Talebiniz yöneticinize iletildi
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#4b7c59', margin: 0, lineHeight: 1.5 }}>
                                            Yöneticiniz size bir şifre sıfırlama kodu paylaşacak. Kodu aldığınızda şifrenizi sıfırlayabilirsiniz.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigate to reset */}
                            <motion.button
                                onClick={() => navigate('/reset-password')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%', height: '52px', borderRadius: '14px', border: 'none',
                                    background: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                                    color: 'white', fontSize: '15px', fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                                    marginBottom: '16px',
                                }}
                            >
                                <span>Kodum Var, Şifreyi Sıfırla</span>
                                <ArrowRight size={18} />
                            </motion.button>

                            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                                    Giriş sayfasına dön
                                </Link>
                            </p>
                        </motion.div>
                    ) : (
                        /* Request Form */
                        <form onSubmit={handleSubmit}>
                            {/* Username */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Kullanıcı Adı
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <PersonCircle style={{
                                        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                        color: focusedField === 'username' ? '#22c55e' : '#d1d5db',
                                        fontSize: '18px', pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s',
                                    }} />
                                    <input
                                        className="form-control"
                                        placeholder="Kullanıcı Adınız"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                        autoFocus required disabled={loading}
                                        style={inputStyle('username')}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <motion.button
                                type="submit" disabled={loading}
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%', height: '52px', borderRadius: '14px', border: 'none',
                                    background: loading ? '#d1d5db' : 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                                    color: 'white', fontSize: '15px', fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: loading ? 'none' : '0 4px 16px rgba(34,197,94,0.35)',
                                    transition: 'all 0.3s', marginBottom: '20px',
                                }}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }} /><span>İşleniyor...</span></>
                                ) : (
                                    <><span>Kod Oluştur</span><ArrowRight size={18} /></>
                                )}
                            </motion.button>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        style={{
                                            padding: '12px 16px', borderRadius: '12px',
                                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
                                        }}
                                    >
                                        <ExclamationCircle style={{ color: '#dc2626', fontSize: '18px', flexShrink: 0 }} />
                                        <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                Şifrenizi hatırladınız mı?{' '}
                                <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                                    Giriş Yap
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
