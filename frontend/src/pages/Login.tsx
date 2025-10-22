import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonCircle,
    Lock,
    ArrowRight,
    ExclamationCircle,
    CheckCircleFill,
    ClipboardData,
    PeopleFill,
    GraphUpArrow
} from 'react-bootstrap-icons';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import logo from '../images/logo.png';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authFetch(`${config.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                login(data.user, data.token);
                navigate('/');
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: isMobile ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : '#ffffff',
                display: 'flex',
                alignItems: 'stretch',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Left Side - App Showcase (Desktop Only) */}
            {!isMobile && (
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '80px 60px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Animated Background Elements */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '-20%',
                            left: '-10%',
                            width: '600px',
                            height: '600px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            filter: 'blur(80px)',
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 30, 0],
                            y: [0, 50, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '-20%',
                            right: '-10%',
                            width: '500px',
                            height: '500px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.08)',
                            filter: 'blur(80px)',
                        }}
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, -40, 0],
                            y: [0, -30, 0],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                        {/* Logo and Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ marginBottom: '60px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '16px',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        backdropFilter: 'blur(10px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            filter: 'brightness(0) invert(1)',
                                        }}
                                    />
                                </div>
                                <h1
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: '700',
                                        color: 'white',
                                        margin: 0,
                                    }}
                                >
                                    Efendim App
                                </h1>
                            </div>
                            <h2
                                style={{
                                    fontSize: '42px',
                                    fontWeight: '700',
                                    color: 'white',
                                    marginBottom: '16px',
                                    lineHeight: '1.2',
                                }}
                            >
                                Talebe Yönetiminde
                                <br />
                                Yeni Nesil Çözüm
                            </h2>
                            <p
                                style={{
                                    fontSize: '18px',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    lineHeight: '1.6',
                                }}
                            >
                                Yoklama, öğrenci takibi ve raporlama işlemlerinizi kolaylaştıran modern yönetim sistemi
                            </p>
                        </motion.div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            {[
                                {
                                    icon: <ClipboardData size={24} />,
                                    title: 'Kolay Yoklama',
                                    description: 'Hızlı ve pratik yoklama alma sistemi',
                                },
                                {
                                    icon: <PeopleFill size={24} />,
                                    title: 'Talebe Takibi',
                                    description: 'Detaylı öğrenci bilgileri ve geçmiş kayıtları',
                                },
                                {
                                    icon: <GraphUpArrow size={24} />,
                                    title: 'Gelişmiş Raporlar',
                                    description: 'İstatistikler ve analiz araçları',
                                },
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                        padding: '20px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                    }}
                                    whileHover={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        scale: 1.02,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: 'white',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {feature.title}
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: '14px',
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                margin: 0,
                                            }}
                                        >
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {/* Right Side - Login Form */}
            <div
                style={{
                    width: isMobile ? '100%' : '480px',
                    minWidth: isMobile ? 'auto' : '480px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '20px' : '40px',
                    position: 'relative',
                    background: isMobile ? 'transparent' : '#ffffff',
                }}
            >
                {/* Mobile Background Elements */}
                {isMobile && (
                    <>
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: '-10%',
                                right: '-5%',
                                width: '500px',
                                height: '500px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.1)',
                                filter: 'blur(80px)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                        <motion.div
                            style={{
                                position: 'absolute',
                                bottom: '-10%',
                                left: '-5%',
                                width: '400px',
                                height: '400px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                filter: 'blur(80px)',
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                x: [0, -30, 0],
                                y: [0, -50, 0],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        maxWidth: '440px',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            padding: '48px 40px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Logo */}
                            <motion.div
                                variants={itemVariants}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: '24px',
                                }}
                            >
                                <motion.div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '20px',
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                                    }}
                                    whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            filter: 'brightness(0) invert(1)',
                                        }}
                                    />
                                </motion.div>
                            </motion.div>

                            {/* Title */}
                            <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <h1
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Hoş Geldiniz
                                </h1>
                                <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
                                    Hesabınıza giriş yapın
                                </p>
                            </motion.div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} autoComplete="on">
                                {/* Username Field */}
                                <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Kullanıcı Adı
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <PersonCircle
                                            style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: focusedField === 'username' ? '#3b82f6' : '#9ca3af',
                                                transition: 'color 0.2s',
                                                fontSize: '20px',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        />
                                        <motion.input
                                            className="form-control"
                                            placeholder="Kullanıcı Adınız"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            autoFocus
                                            disabled={loading}
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'username' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                            }}
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Password Field */}
                                <motion.div variants={itemVariants} style={{ marginBottom: '28px' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#374151',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Şifre
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock
                                            style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: focusedField === 'password' ? '#3b82f6' : '#9ca3af',
                                                transition: 'color 0.2s',
                                                fontSize: '20px',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        />
                                        <motion.input
                                            className="form-control"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading}
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'password' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                            }}
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Submit Button */}
                                <motion.button
                                    variants={itemVariants}
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        height: '56px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: loading
                                            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                            : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: loading ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.4)',
                                        transition: 'all 0.3s',
                                    }}
                                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 6px 24px rgba(59, 130, 246, 0.5)' } : {}}
                                    whileTap={!loading ? { scale: 0.98 } : {}}
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm"
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span>Giriş yapılıyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Giriş Yap</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </motion.button>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                marginTop: '20px',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}
                                        >
                                            <ExclamationCircle
                                                style={{
                                                    color: '#dc2626',
                                                    fontSize: '20px',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    color: '#dc2626',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {error}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Signup Link */}
                                <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '24px' }}>
                                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                        Hesabınız yok mu?{' '}
                                        <Link
                                            to="/signup"
                                            style={{
                                                color: '#3b82f6',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            Kayıt Ol
                                        </Link>
                                    </p>
                                </motion.div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Footer Text - Only show on mobile */}
                    {isMobile && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            style={{
                                textAlign: 'center',
                                marginTop: '24px',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '14px',
                                fontWeight: '500',
                            }}
                        >
                            © 2025 Efendim App. Tüm hakları saklıdır.
                        </motion.p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
