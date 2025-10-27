import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PersonCircle,
    ArrowRight,
    ExclamationCircle,
    CheckCircleFill,
    ArrowLeft
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
                        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                            <Link
                                to="/login"
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
                                Giriş sayfasına dön
                            </Link>
                        </motion.div>

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
                                Şifremi Unuttum
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
                                {success
                                    ? 'Talebiniz alındı!'
                                    : 'Kullanıcı adınızı girin ve şifre sıfırlama talebinde bulunun'
                                }
                            </p>
                        </motion.div>

                        {/* Success View */}
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '2px solid rgba(34, 197, 94, 0.3)',
                                        marginBottom: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <CheckCircleFill
                                        size={48}
                                        style={{ color: '#22c55e', marginBottom: '16px' }}
                                    />
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a', marginBottom: '12px' }}>
                                        Talebiniz Alındı
                                    </h3>
                                    <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px' }}>
                                        Şifre sıfırlama talebiniz yöneticinize iletildi.
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0' }}>
                                        Yöneticiniz size bir şifre sıfırlama kodu paylaşacak. Kodu aldığınızda aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate('/reset-password')}
                                    style={{
                                        width: '100%',
                                        height: '56px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
                                        marginBottom: '12px',
                                    }}
                                >
                                    <span>Kodum Var, Şifreyi Sıfırla</span>
                                    <ArrowRight size={20} />
                                </button>

                                <Link
                                    to="/login"
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Giriş sayfasına dön
                                </Link>
                            </motion.div>
                        ) : (
                            /* Request Form */
                            <form onSubmit={handleSubmit}>
                                {/* Username Field */}
                                <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
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
                                            autoFocus
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
                                            <span>İşleniyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Kod Oluştur</span>
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
                </div >
            </motion.div >
        </div >
    );
}
