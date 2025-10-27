import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Building, Check, ChevronDown, Plus } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import config from '../config';

export const YurtSelector: React.FC = () => {
    const { availableYurts, selectedYurt, switchYurt, canSwitchYurts } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newYurtName, setNewYurtName] = useState('');
    const [newYurtLocation, setNewYurtLocation] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Filter to only show active yurts
    const activeYurts = availableYurts.filter(yurt => yurt.isActive !== false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreateForm(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show selector for admins and super-admins (they can create/manage yurts)
    if (!canSwitchYurts) {
        return null;
    }

    const handleCreateYurt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newYurtName.trim()) return;

        setIsCreating(true);
        try {
            const token = localStorage.getItem('token');
            console.log('Creating yurt:', {
                name: newYurtName.trim(),
                location: newYurtLocation.trim() || null,
                url: `${config.API_BASE_URL}/yurts`
            });

            const response = await fetch(`${config.API_BASE_URL}/yurts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    yurt_name: newYurtName.trim(),
                    location: newYurtLocation.trim() || null,
                    description: `Created by admin`,
                }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                alert('Yurt başarıyla oluşturuldu! Sayfa yenileniyor...');
                // Clear form
                setNewYurtName('');
                setNewYurtLocation('');
                setShowCreateForm(false);
                // Reload to fetch new yurt list
                window.location.reload();
            } else {
                alert(`Hata: ${data.message || 'Yurt oluşturulamadı'}`);
            }
        } catch (error) {
            console.error('Create yurt error:', error);
            alert('Yurt oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                }}
            >
                <Building size={18} />
                <span>
                    {selectedYurt?.yurtName || (availableYurts.length === 0 ? 'Yurt Yönetimi' : 'Yurt Seçin')}
                </span>
                <ChevronDown
                    size={14}
                    style={{
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: dropdownRef.current ?
                            `${Math.min(dropdownRef.current.getBoundingClientRect().bottom + 8, window.innerHeight - 550)}px` : 'auto',
                        left: dropdownRef.current ?
                            `${dropdownRef.current.getBoundingClientRect().left}px` : 'auto',
                        width: '300px',
                        height: 'auto',
                        maxHeight: '500px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e5e7eb',
                        padding: '8px',
                        zIndex: 9999,
                        WebkitOverflowScrolling: 'touch',
                    } as React.CSSProperties}
                >
                    <div
                        style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Yurtlarım
                    </div>

                    {activeYurts.length === 0 && (
                        <div
                            style={{
                                padding: '20px 12px',
                                textAlign: 'center',
                                color: '#6b7280',
                                fontSize: '14px',
                            }}
                        >
                            Henüz yurdunuz yok.
                            <br />
                            <span style={{ fontSize: '12px' }}>
                                Aşağıdan yeni bir yurt oluşturabilirsiniz.
                            </span>
                        </div>
                    )}

                    {activeYurts.map((yurt) => {
                        const isSelected = yurt.yurtId === selectedYurt?.yurtId;
                        return (
                            <div
                                key={yurt.yurtId}
                                onClick={() => {
                                    switchYurt(yurt);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    marginBottom: '4px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#3b82f6' : 'transparent',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = '#f3f4f6';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: isSelected ? '#ffffff' : '#1f2937',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        {yurt.yurtName}
                                    </div>
                                    {yurt.location && (
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
                                            }}
                                        >
                                            {yurt.location}
                                        </div>
                                    )}
                                    {yurt.isPrimary && (
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#3b82f6',
                                            }}
                                        >
                                            Varsayılan
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <Check
                                        size={18}
                                        style={{
                                            color: '#ffffff',
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

                    {/* Create New Yurt Button/Form */}
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#3b82f6',
                                transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#eff6ff';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <Plus size={18} />
                            <span>Yeni Yurt Oluştur</span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreateYurt} style={{ padding: '8px' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Yurt Adı *"
                                    value={newYurtName}
                                    onChange={(e) => setNewYurtName(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={isCreating}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Konum (opsiyonel)"
                                    value={newYurtLocation}
                                    onChange={(e) => setNewYurtLocation(e.target.value)}
                                    disabled={isCreating}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newYurtName.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: isCreating ? '#9ca3af' : '#3b82f6',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: isCreating ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewYurtName('');
                                        setNewYurtLocation('');
                                    }}
                                    disabled={isCreating}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        background: 'white',
                                        color: '#6b7280',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: isCreating ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};
