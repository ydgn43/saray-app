// src/components/AppSidebar.tsx
import React from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaListAlt, FaChartBar, FaUser, FaCog, FaHome, FaSignOutAlt, FaUserCheck, FaKey, FaUserGraduate, FaHistory, FaShieldAlt, FaDoorOpen } from 'react-icons/fa';
import { IconType } from 'react-icons';
import logo from '../images/logo.png'; // Adjust the path if needed
import packageJson from '../../package.json';
import { useAuth } from '../auth/AuthContext'; // <-- Add this import
import { YurtSelector } from './YurtSelector'; // <-- Add YurtSelector
import './AppSidebar.css';

const APP_VERSION = packageJson.version;

interface Props {
    collapsed: boolean;
    toggled: boolean;
    onToggle: () => void;
    mobileMode?: boolean;
}

// Create a simple wrapper component for the icons
const IconComponent = ({ icon: Icon }: { icon: IconType }) => {
    const IconComponent = Icon as React.ComponentType<any>;
    return <IconComponent size={20} />;
};

const AppSidebar: React.FC<Props> = ({ collapsed, toggled, onToggle, mobileMode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user, yurtName } = useAuth(); // <-- Added yurtName
    const [showUserModal, setShowUserModal] = React.useState(false);

    // Map role names to Turkish display names
    const getRoleDisplayName = (role: string): string => {
        const roleMap: { [key: string]: string } = {
            'super-admin': 'Super Admin',
            'admin': 'Admin',
            'hoca': 'Hoca',
            'yoklamaci': 'Yoklamacı',
            'talebe': 'Talebe'
        };
        return roleMap[role] || role;
    };

    // Get initials from username for avatar
    const getInitials = (username: string): string => {
        return username.substring(0, 2).toUpperCase();
    };

    // Close modal when clicking outside
    const handleModalBackdropClick = () => {
        setShowUserModal(false);
    };

    return (
        <>
            {/* Mobile Backdrop - Only show on mobile when sidebar is open */}
            {mobileMode && toggled && (
                <div
                    className="mobile-sidebar-backdrop"
                    onClick={onToggle}
                />
            )}

            <Sidebar
                style={{
                    height: '100vh',
                    position: mobileMode ? 'fixed' : 'relative',
                    top: 0,
                    left: 0,
                    zIndex: 1350,
                    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: mobileMode && toggled ? '2px 0 16px rgba(0,0,0,0.25)' : undefined,
                    width: 250,
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    ...(mobileMode
                        ? { transform: toggled ? 'translateX(0)' : 'translateX(-100%)' }
                        : {}),
                }}
                collapsed={false}
                toggled={toggled}
                onToggle={onToggle}
            >
                {/* Top: Logo and App Name */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '1.5rem 1rem 1rem 1rem',
                    borderBottom: '1px solid #e5e5e5',
                    minHeight: 64,
                }}>
                    <img src={logo} alt="Efendim Logo" style={{ width: 36, height: 36 }} />
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#0d6efd' }}>Efendim!</span>
                </div>

                {/* Menu */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Menu>
                        {/* --- Super Admin Only: Single Menu Item --- */}
                        {user?.role === 'super-admin' ? (
                            <MenuItem
                                active={location.pathname === '/super-admin'}
                                icon={<IconComponent icon={FaShieldAlt} />}
                                component={<Link to="/super-admin" />}
                                onClick={mobileMode ? onToggle : undefined}
                            >
                                Super Admin
                            </MenuItem>
                        ) : (
                            <>
                                {/* --- Regular Users: Show all menu items --- */}
                                <MenuItem
                                    active={location.pathname === '/'}
                                    icon={<IconComponent icon={FaHome} />}
                                    component={<Link to="/" />}
                                    onClick={mobileMode ? onToggle : undefined}
                                >
                                    Ana Sayfa
                                </MenuItem>
                                {/* --- Student Portal: Only for talebe --- */}
                                {user?.role === 'talebe' && (
                                    <MenuItem
                                        active={location.pathname === '/student-portal'}
                                        icon={<IconComponent icon={FaUserGraduate} />}
                                        component={<Link to="/student-portal" />}
                                        onClick={mobileMode ? onToggle : undefined}
                                    >
                                        İstatistiklerim
                                    </MenuItem>
                                )}
                                {/* --- Regular Menu Items: For admin, hoca, and yoklamaci --- */}
                                {(user?.role === 'admin' || user?.role === 'hoca' || user?.role === 'yoklamaci') && (
                                    <>
                                        <MenuItem
                                            active={location.pathname === '/attendance'}
                                            icon={<IconComponent icon={FaListAlt} />}
                                            component={<Link to="/attendance" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            Yoklama
                                        </MenuItem>
                                        <MenuItem
                                            active={location.pathname === '/statistics'}
                                            icon={<IconComponent icon={FaChartBar} />}
                                            component={<Link to="/statistics" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            İstatistik
                                        </MenuItem>
                                        <MenuItem
                                            active={location.pathname === '/exit-tracking'}
                                            icon={<IconComponent icon={FaDoorOpen} />}
                                            component={<Link to="/exit-tracking" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            Çıkış/Giriş Takibi
                                        </MenuItem>
                                    </>
                                )}
                                {user?.role === 'admin' && (
                                    <MenuItem
                                        active={location.pathname === '/talebeler'}
                                        icon={<IconComponent icon={FaUser} />}
                                        component={<Link to="/talebeler" />}
                                        onClick={mobileMode ? onToggle : undefined}
                                    >
                                        Talebeler
                                    </MenuItem>
                                )}
                                {/* İzinli Talebeler - Hidden from talebe role */}
                                {user?.role !== 'talebe' && (
                                    <MenuItem
                                        icon={<IconComponent icon={FaUserCheck} />}
                                        component={<Link to="/izinli-talebeler" />}
                                        onClick={mobileMode ? onToggle : undefined}
                                    >
                                        İzinli Talebeler
                                    </MenuItem>
                                )}
                                {/* --- Admin Only: Reference Code Management --- */}
                                {user?.role === 'admin' && (
                                    <>
                                        <MenuItem
                                            active={location.pathname === '/reference-codes'}
                                            icon={<IconComponent icon={FaKey} />}
                                            component={<Link to="/reference-codes" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            Referans Kodları
                                        </MenuItem>
                                        <MenuItem
                                            active={location.pathname === '/activity-logs'}
                                            icon={<IconComponent icon={FaHistory} />}
                                            component={<Link to="/activity-logs" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            Aktivite Logları
                                        </MenuItem>
                                        <MenuItem
                                            active={location.pathname === '/settings'}
                                            icon={<IconComponent icon={FaCog} />}
                                            component={<Link to="/settings" />}
                                            onClick={mobileMode ? onToggle : undefined}
                                        >
                                            Ayarlar
                                        </MenuItem>
                                    </>
                                )}
                            </>
                        )}
                    </Menu>
                </div>

                {/* Yurt Selector - For admins with multiple yurts (NOT for super-admin) */}
                {user?.role !== 'super-admin' && (
                    <div style={{ padding: '12px 16px' }}>
                        <YurtSelector />
                    </div>
                )}

                {/* User Profile Section - Inside Sidebar */}
                {user && (
                    <div
                        className="user-profile-section"
                        onClick={() => setShowUserModal(!showUserModal)}
                    >
                        {/* Profile Photo/Avatar */}
                        <div className="user-avatar">
                            {getInitials(user.username)}
                        </div>

                        {/* User Info */}
                        <div className="user-info">
                            <div className="user-name">
                                {user.username}
                            </div>
                            <div className="user-role">
                                {getRoleDisplayName(user.role)}
                            </div>
                            {yurtName && user.role !== 'super-admin' && (
                                <div className="user-yurt" style={{
                                    fontSize: '11px',
                                    color: '#0d6efd',
                                    marginTop: '2px',
                                    fontWeight: 500
                                }}>
                                    📍 {yurtName}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom: Version */}
                <div style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid #e5e5e5',
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#888',
                    background: '#f8f9fa'
                }}>
                    {`v${APP_VERSION}`}
                </div>
            </Sidebar>

            {/* User Modal - Small popup */}
            {user && showUserModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="user-modal-backdrop"
                        onClick={handleModalBackdropClick}
                    />

                    {/* Modal Content */}
                    <div className={`user-modal ${mobileMode ? 'mobile' : ''}`}>
                        <div className="user-modal-header">
                            <div className="user-avatar-large">
                                {getInitials(user.username)}
                            </div>
                            <div className="user-modal-info">
                                <div className="user-modal-name">{user.username}</div>
                                <div className="user-modal-role">{getRoleDisplayName(user.role)}</div>
                            </div>
                        </div>

                        <div className="user-modal-divider" />

                        {/* Profile Button */}
                        <button
                            className="user-modal-settings"
                            onClick={() => {
                                navigate('/profile');
                                setShowUserModal(false);
                                if (mobileMode) onToggle();
                            }}
                        >
                            <IconComponent icon={FaCog} />
                            <span>Ayarlar</span>
                        </button>

                        {/* Logout Button */}
                        <button
                            className="user-modal-logout"
                            onClick={() => {
                                logout();
                                setShowUserModal(false);
                                if (mobileMode) onToggle();
                            }}
                        >
                            <IconComponent icon={FaSignOutAlt} />
                            <span>Çıkış Yap</span>
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default AppSidebar;
