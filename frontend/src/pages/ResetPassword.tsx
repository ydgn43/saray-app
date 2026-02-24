import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, ArrowRight, ExclamationCircle, CheckCircleFill, ArrowLeft, PersonCircle, ShieldLock } from 'react-bootstrap-icons';
import config from '../config';
import logo from '../images/logo.png';
import { toast } from 'react-toastify';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const stateData = location.state as { username?: string; resetToken?: string } | undefined;

    const [username, setUsername] = useState(stateData?.username || '');
    const [resetToken, setResetToken] = useState(stateData?.resetToken || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !resetToken || !newPassword) { setError('Tüm alanları doldurun'); return; }
        if (newPassword.length < 4) { setError('Şifre en az 4 karakter olmalıdır'); return; }
        if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${config.API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), resetToken: resetToken.trim(), newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                toast.success('Şifreniz başarıyla sıfırlandı!');
                setTimeout(() => navigate('/login'), 2000);
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
            minHeight: '100vh', backgroundColor: '#f3f4f6',
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
                    {/* Logo + Headline */}
                    <div style={{ marginBottom: '32px' }}>
                        {!success && (
                            <Link to="/forgot-password" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                color: '#22c55e', fontSize: '13px', fontWeight: '500',
                                textDecoration: 'none', marginBottom: '20px',
                            }}>
                                <ArrowLeft size={14} /> Geri
                            </Link>
                        )}
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
                            {success ? 'Şifre Sıfırlandı ✅' : 'Şifre Sıfırla'}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                            {success ? 'Giriş sayfasına yönlendiriliyorsunuz...' : 'Sıfırlama kodunuzu ve yeni şifrenizi girin.'}
                        </p>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                                style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #86efac, #22c55e)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
                                }}
                            >
                                <CheckCircleFill color="white" size={36} />
                            </motion.div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a', marginBottom: '8px' }}>
                                Başarılı!
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
                                Şifreniz başarıyla güncellendi.
                            </p>
                            <Link to="/login" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '12px 28px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                                color: 'white', textDecoration: 'none',
                                fontSize: '15px', fontWeight: '600',
                                boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                            }}>
                                Giriş Yap <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Username */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Kullanıcı Adı
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <PersonCircle style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'username' ? '#22c55e' : '#d1d5db', fontSize: '18px', pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s' }} />
                                    <input className="form-control" placeholder="Kullanıcı Adınız" value={username} onChange={e => setUsername(e.target.value)}
                                        onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)} disabled={loading} style={inputStyle('username')} />
                                </div>
                            </div>

                            {/* Reset Token */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Sıfırlama Kodu
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Key style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'resetToken' ? '#22c55e' : '#d1d5db', fontSize: '18px', pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s' }} />
                                    <input className="form-control" placeholder="8 haneli kod" value={resetToken}
                                        onChange={e => setResetToken(e.target.value.toUpperCase())}
                                        onFocus={() => setFocusedField('resetToken')} onBlur={() => setFocusedField(null)}
                                        disabled={loading} maxLength={8}
                                        style={{ ...inputStyle('resetToken'), textTransform: 'uppercase', letterSpacing: '3px' }} />
                                </div>
                            </div>

                            {/* New Password */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Yeni Şifre
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'newPassword' ? '#22c55e' : '#d1d5db', fontSize: '18px', pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s' }} />
                                    <input className="form-control" type="password" placeholder="••••••••" value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        onFocus={() => setFocusedField('newPassword')} onBlur={() => setFocusedField(null)}
                                        disabled={loading} style={inputStyle('newPassword')} />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Yeni Şifre Tekrar
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'confirmPassword' ? '#22c55e' : '#d1d5db', fontSize: '18px', pointerEvents: 'none', zIndex: 1, transition: 'color 0.2s' }} />
                                    <input className="form-control" type="password" placeholder="••••••••" value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                                        disabled={loading} style={inputStyle('confirmPassword')} />
                                </div>
                            </div>

                            {/* Submit */}
                            <motion.button type="submit" disabled={loading}
                                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%', height: '52px', borderRadius: '14px', border: 'none',
                                    background: loading ? '#d1d5db' : 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                                    color: 'white', fontSize: '15px', fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: loading ? 'none' : '0 4px 16px rgba(34,197,94,0.35)',
                                    transition: 'all 0.3s', marginBottom: '20px',
                                }}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }} /><span>Sıfırlanıyor...</span></>
                                ) : (
                                    <><span>Şifreyi Sıfırla</span><ArrowRight size={18} /></>
                                )}
                            </motion.button>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <ExclamationCircle style={{ color: '#dc2626', fontSize: '18px', flexShrink: 0 }} />
                                        <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                Giriş yapmak ister misiniz?{' '}
                                <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Giriş Yap</Link>
                            </p>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
