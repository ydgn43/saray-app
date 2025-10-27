import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonCircle,
    Lock,
    Key,
    ArrowRight,
    ExclamationCircle,
    CheckCircleFill,
    ArrowLeft
} from 'react-bootstrap-icons';
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

        // Validation
        if (!username || !resetToken || !newPassword) {
            setError('Tüm alanları doldurun');
            return;
        }

        if (newPassword.length < 4) {
            setError('Şifre en az 4 karakter olmalıdır');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${config.API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    resetToken: resetToken.trim(),
                    newPassword
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                toast.success('Şifreniz başarıyla sıfırlandı!');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.message || 'Bir hata oluştu');
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
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated Background Elements */}
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
                        {/* Back Button */}
                        {!success && (
                            <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                                <Link
                                    to="/forgot-password"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#3b82f6',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    <ArrowLeft size={16} />
                                    Geri
                                </Link>
                            </motion.div>
                        )}

                        {/* Logo */}
                        <motion.div
                            variants={itemVariants}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <div
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
                            </div>
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
                                Şifre Sıfırla
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
                                {success
                                    ? 'Şifreniz başarıyla sıfırlandı!'
                                    : 'Sıfırlama kodunuzu ve yeni şifrenizi girin'
                                }
                            </p>
                        </motion.div>

                        {/* Success View */}
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                style={{ textAlign: 'center' }}
                            >
                                <CheckCircleFill
                                    size={64}
                                    style={{ color: '#22c55e', marginBottom: '24px' }}
                                />
                                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#16a34a', marginBottom: '12px' }}>
                                    Başarılı!
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '24px' }}>
                                    Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...
                                </p>
                                <Link
                                    to="/login"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
                                    }}
                                >
                                    Giriş Yap
                                    <ArrowRight size={20} />
                                </Link>
                            </motion.div>
                        ) : (
                            /* Reset Form */
                            <form onSubmit={handleSubmit}>
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
                                        <input
                                            className="form-control"
                                            placeholder="Kullanıcı Adınız"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading}
                                            required
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'username' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Reset Token Field */}
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
                                        Sıfırlama Kodu
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Key
                                            style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: focusedField === 'resetToken' ? '#3b82f6' : '#9ca3af',
                                                transition: 'color 0.2s',
                                                fontSize: '20px',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        />
                                        <input
                                            className="form-control"
                                            placeholder="8 haneli kod"
                                            value={resetToken}
                                            onChange={e => setResetToken(e.target.value.toUpperCase())}
                                            onFocus={() => setFocusedField('resetToken')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading}
                                            required
                                            maxLength={8}
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'resetToken' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                                textTransform: 'uppercase',
                                                letterSpacing: '2px',
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* New Password Field */}
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
                                        Yeni Şifre
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock
                                            style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: focusedField === 'newPassword' ? '#3b82f6' : '#9ca3af',
                                                transition: 'color 0.2s',
                                                fontSize: '20px',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        />
                                        <input
                                            className="form-control"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            onFocus={() => setFocusedField('newPassword')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading}
                                            required
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'newPassword' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Confirm Password Field */}
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
                                        Yeni Şifre (Tekrar)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock
                                            style={{
                                                position: 'absolute',
                                                left: '16px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: focusedField === 'confirmPassword' ? '#3b82f6' : '#9ca3af',
                                                transition: 'color 0.2s',
                                                fontSize: '20px',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        />
                                        <input
                                            className="form-control"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            onFocus={() => setFocusedField('confirmPassword')}
                                            onBlur={() => setFocusedField(null)}
                                            disabled={loading}
                                            required
                                            style={{
                                                paddingLeft: '48px',
                                                height: '52px',
                                                border: focusedField === 'confirmPassword' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                fontSize: '15px',
                                                transition: 'all 0.2s',
                                                backgroundColor: '#f9fafb',
                                            }}
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
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm"
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span>Sıfırlanıyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Şifreyi Sıfırla</span>
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
                            </form>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
