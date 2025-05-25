// src/components/Layout.tsx
import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import { useIsMobile } from '../hooks/useIsMobile';
import { FaBars } from 'react-icons/fa';
import { IconType } from 'react-icons';

const IconComponent = ({ icon: Icon }: { icon: IconType }) => {
    const IconComponent = Icon as React.ComponentType<any>;
    return <IconComponent size={20} />;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => setSidebarOpen(open => !open);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      {/* Always render sidebar for animation */}
      <AppSidebar
        collapsed={false}
        toggled={sidebarOpen}
        onToggle={closeSidebar}
        mobileMode={isMobile}
      />

      {/* Always render overlay for animation */}
      {isMobile && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 1200,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
          }}
        />
      )}

      {/* Sticky mobile header */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            background: '#0d6efd',
            color: '#fff',
            zIndex: 1250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 20 }}>SarayApp</span>
          <button
            className="btn btn-outline-light"
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={toggleSidebar}
          >
            <IconComponent icon={FaBars} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '72px 1rem 1rem 1rem' : '1rem',
          position: 'relative',
          zIndex: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
