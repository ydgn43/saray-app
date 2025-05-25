// src/components/AppSidebar.tsx
import React from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link, useLocation } from 'react-router-dom';
import { FaListAlt, FaChartBar, FaUser, FaCog } from 'react-icons/fa';
import { IconType } from 'react-icons';
import logo from '../images/logo.png'; // Adjust the path if needed
import packageJson from '../../package.json';

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

    return (
        <Sidebar
            style={{
                height: '100vh',
                position: mobileMode ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                zIndex: 1300,
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
                <img src={logo} alt="SarayApp Logo" style={{ width: 36, height: 36 }} />
                <span style={{ fontWeight: 700, fontSize: 20, color: '#0d6efd' }}>SarayApp</span>
            </div>

            {/* Menu */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Menu>
                    <MenuItem
                        active={location.pathname === '/attendance'}
                        icon={<IconComponent icon={FaListAlt} />}
                        component={<Link to="/attendance" />}
                        onClick={onToggle}
                    >
                        Yoklama
                    </MenuItem>
                    <MenuItem
                        active={location.pathname === '/statistics'}
                        icon={<IconComponent icon={FaChartBar} />}
                        component={<Link to="/statistics" />}
                        onClick={onToggle}
                    >
                        İstatistik
                    </MenuItem>
                    <MenuItem
                        active={location.pathname === '/talebeler'}
                        icon={<IconComponent icon={FaUser} />}
                        component={<Link to="/talebeler" />}
                        onClick={onToggle}
                    >
                        Talebeler
                    </MenuItem>
                    <MenuItem
                        active={location.pathname === '/settings'}
                        icon={<IconComponent icon={FaCog} />}
                        component={<Link to="/settings" />}
                        onClick={onToggle}
                    >
                        Ayarlar
                    </MenuItem>
                </Menu>
            </div>

            {/* Bottom: Version */}
            <div style={{
                marginTop: 'auto',
                padding: '1rem',
                borderTop: '1px solid #e5e5e5',
                textAlign: 'center',
                fontSize: 13,
                color: '#888',
                background: '#f8f9fa'
            }}>
                {`v${APP_VERSION}`}
            </div>
        </Sidebar>
    );
};

export default AppSidebar;
