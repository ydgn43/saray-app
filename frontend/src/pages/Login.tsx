import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonCircle,
    Lock,
    ArrowRight,
    ExclamationCircle,
    ClipboardData,
    PeopleFill,
    GraphUpArrow,
    CheckCircleFill,
} from 'react-bootstrap-icons';
import config from '../config';
import logo from '../images/logo.png';

export default function Login() {
    const { login, setYurtName, loadUserYurts, setYurtsData } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-advance carousel dots
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                login(data.user, data.token);

                if (data.availableYurts && data.availableYurts.length > 0) {
                    const yurts = data.availableYurts;
                    const primaryYurt = data.selectedYurt || yurts.find((y: any) => y.isPrimary) || yurts[0];
                    localStorage.setItem('availableYurts', JSON.stringify(yurts));
                    localStorage.setItem('selectedYurt', JSON.stringify(primaryYurt));
                    localStorage.setItem('yurtName', primaryYurt.yurtName);
                    setYurtName(primaryYurt.yurtName);
                    setYurtsData(yurts, primaryYurt);
                } else if (data.yurtName) {
                    setYurtName(data.yurtName);
                    localStorage.setItem('yurtName', data.yurtName);
                } else {
                    localStorage.removeItem('yurtName');
                    localStorage.removeItem('selectedYurt');
                    localStorage.removeItem('availableYurts');
                    setYurtName(null);
                    setYurtsData([], null);
                }

                if (data.user.role === 'super-admin') {
                    navigate('/super-admin');
                } else {
                    navigate('/');
                }
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

    const slides = [
        {
            icon: <ClipboardData size={40} color="#4ade80" />,
            title: 'Kolay Yoklama',
            desc: 'Hızlı ve pratik yoklama alma sistemi',
        },
        {
            icon: <PeopleFill size={40} color="#4ade80" />,
            title: 'Talebe Takibi',
            desc: 'Detaylı öğrenci bilgileri ve geçmiş kayıtları',
        },
        {
            icon: <GraphUpArrow size={40} color="#4ade80" />,
            title: 'Gelişmiş Raporlar',
            desc: 'İstatistikler ve analiz araçları',
        },
    ];

    // Shared input style
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
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '16px' : '32px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
        >
            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    maxWidth: isMobile ? '440px' : '900px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    minHeight: isMobile ? 'auto' : '580px',
                }}
            >
                {/* ─── LEFT: Form Section ─── */}
                <div
                    style={{
                        flex: '1 1 50%',
                        padding: isMobile ? '36px 28px' : '52px 48px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {/* Logo + Headline */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={logo}
                                    alt="Logo"
                                    style={{ width: '22px', height: '22px', filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#6b7280' }}>Efendim App</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', lineHeight: 1.2 }}>
                            Hoş Geldiniz
                        </h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                            Devam etmek için hesabınıza giriş yapın.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} autoComplete="on">
                        {/* Username */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                Kullanıcı Adı
                            </label>
                            <div style={{ position: 'relative' }}>
                                <PersonCircle
                                    style={{
                                        position: 'absolute', left: '16px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: focusedField === 'username' ? '#22c55e' : '#d1d5db',
                                        fontSize: '18px', pointerEvents: 'none', zIndex: 1,
                                        transition: 'color 0.2s',
                                    }}
                                />
                                <input
                                    className="form-control"
                                    placeholder="Kullanıcı Adınız"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onFocus={() => setFocusedField('username')}
                                    onBlur={() => setFocusedField(null)}
                                    autoFocus
                                    disabled={loading}
                                    style={inputStyle('username')}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                Şifre
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock
                                    style={{
                                        position: 'absolute', left: '16px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: focusedField === 'password' ? '#22c55e' : '#d1d5db',
                                        fontSize: '18px', pointerEvents: 'none', zIndex: 1,
                                        transition: 'color 0.2s',
                                    }}
                                />
                                <input
                                    className="form-control"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    disabled={loading}
                                    style={inputStyle('password')}
                                />
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                            <Link
                                to="/forgot-password"
                                style={{ color: '#22c55e', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}
                            >
                                Şifremi Unuttum
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={!loading ? { scale: 1.02 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            style={{
                                width: '100%',
                                height: '52px',
                                borderRadius: '14px',
                                border: 'none',
                                background: loading
                                    ? '#d1d5db'
                                    : 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: loading ? 'none' : '0 4px 16px rgba(34,197,94,0.35)',
                                transition: 'all 0.3s',
                                marginBottom: '20px',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }} />
                                    <span>Giriş yapılıyor...</span>
                                </>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>veya ile devam et</span>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                        </div>

                        {/* Social Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
                            {[
                                { label: 'G', color: '#ea4335', title: 'Google' },
                                { label: 'M', color: '#0078d4', title: 'Microsoft' },
                                { label: 'A', color: '#000000', title: 'Apple' },
                            ].map((social) => (
                                <motion.button
                                    key={social.label}
                                    type="button"
                                    whileHover={{ scale: 1.08, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                                    whileTap={{ scale: 0.95 }}
                                    title={social.title}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: '1.5px solid #e5e7eb',
                                        background: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: social.color,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {social.label}
                                </motion.button>
                            ))}
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <ExclamationCircle style={{ color: '#dc2626', fontSize: '18px', flexShrink: 0 }} />
                                    <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Signup link */}
                        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                            Hesabınız yok mu?{' '}
                            <Link to="/signup" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                                Kayıt Ol
                            </Link>
                        </p>
                    </form>
                </div>

                {/* ─── RIGHT: Visual Panel ─── */}
                {!isMobile && (
                    <div
                        style={{
                            flex: '1 1 50%',
                            background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '52px 40px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative background circles */}
                        <div style={{
                            position: 'absolute', top: '-60px', right: '-60px',
                            width: '220px', height: '220px', borderRadius: '50%',
                            background: 'rgba(74,222,128,0.15)',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-40px', left: '-40px',
                            width: '160px', height: '160px', borderRadius: '50%',
                            background: 'rgba(34,197,94,0.12)',
                        }} />

                        {/* Floating badge - top left */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute', top: '60px', left: '32px',
                                background: '#fff',
                                borderRadius: '14px',
                                padding: '10px 14px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <CheckCircleFill color="#22c55e" size={16} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>Yoklama Alındı</span>
                        </motion.div>

                        {/* Floating badge - bottom right */}
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            style={{
                                position: 'absolute', bottom: '90px', right: '28px',
                                background: '#fff',
                                borderRadius: '14px',
                                padding: '10px 14px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <GraphUpArrow color="#22c55e" size={16} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>%94 Devam</span>
                        </motion.div>

                        {/* Floating user badges */}
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            style={{
                                position: 'absolute', top: '120px', right: '28px',
                                background: '#fff',
                                borderRadius: '14px',
                                padding: '10px 14px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <PeopleFill color="#22c55e" size={16} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>42 Talebe</span>
                        </motion.div>

                        {/* Main illustration placeholder */}
                        <motion.div
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #86efac 0%, #4ade80 50%, #22c55e 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 12px 40px rgba(34,197,94,0.25)',
                                marginBottom: '28px',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            <div
                                style={{
                                    width: '130px',
                                    height: '130px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={logo}
                                    alt="Illustration"
                                    style={{
                                        width: '70px',
                                        height: '70px',
                                        filter: 'brightness(0) invert(1)',
                                        opacity: 0.9,
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* Slide text */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSlide}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}
                            >
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#15803d', margin: '0 0 6px 0' }}>
                                    {slides[activeSlide].title}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#4b7c59', margin: 0, maxWidth: '220px' }}>
                                    {slides[activeSlide].desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Pagination dots */}
                        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
                            {slides.map((_, i) => (
                                <motion.div
                                    key={i}
                                    onClick={() => setActiveSlide(i)}
                                    animate={{ width: activeSlide === i ? '24px' : '8px' }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        height: '8px',
                                        borderRadius: '4px',
                                        background: activeSlide === i ? '#16a34a' : '#86efac',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
