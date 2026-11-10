// src/pages/Settings.tsx
// One page for everything an Admin sets up. Sections are grouped on the left (a dropdown on phones);
// the open section is kept in the address (?bolum=seasons), so a reload or a shared link opens the same section.
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookOpen, Building2, CalendarDays, Layers, LucideIcon, MessageSquareText, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import UserManagement from './UserManagement';
import YurtManagement from './YurtManagement';
import AttendanceReasonsManagement from '../components/AttendanceReasonsManagement';
import SeasonsManagement from '../components/settings/SeasonsManagement';
import OrderedNamesManagement from '../components/settings/OrderedNamesManagement';

interface Section {
    key: string;
    group: string;
    label: string;
    icon: LucideIcon;
    description: string;
    render: () => React.ReactNode;
}

const SECTIONS: Section[] = [
    { key: 'users', group: 'Hesaplar', label: 'Kullanıcılar', icon: Users,
      description: 'Yurtu kullanan hesaplar ve rolleri.', render: () => <UserManagement /> },
    { key: 'yurts', group: 'Hesaplar', label: 'Yurtlar', icon: Building2,
      description: 'Yurtlarınızı görüntüleyin ve düzenleyin.', render: () => <YurtManagement /> },
    { key: 'seasons', group: 'Eğitim düzeni', label: 'Sezonlar', icon: CalendarDays,
      description: 'Eğitim yılları. "Güncel" sezon, yeni talebelerin başlangıç sezonudur.', render: () => <SeasonsManagement /> },
    { key: 'programs', group: 'Eğitim düzeni', label: 'Programlar', icon: BookOpen,
      description: 'Günün programları (örn. Sabah Namazı). Sıralama Yoklama sayfasında aynen görünür.', render: () => <OrderedNamesManagement kind="program" /> },
    { key: 'levels', group: 'Eğitim düzeni', label: 'Dahili Seviyeler', icon: Layers,
      description: 'Talebelerin sınıf / seviye listesi. Sıralama tablolarda ve listelerde görünür.', render: () => <OrderedNamesManagement kind="class" /> },
    { key: 'reasons', group: 'Yoklama', label: 'Yoklama Sebepleri', icon: MessageSquareText,
      description: 'Yoklama sayfasında GEÇ, İZİNLİ ve YOK için seçilebilen sebepler. "Diğer" (serbest yazı) her zaman ayrıca bulunur. Bir sebebi silmek veya adını değiştirmek eski yoklama kayıtlarını değiştirmez.',
      render: () => <AttendanceReasonsManagement /> },
];

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)));

const Settings = () => {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const open = SECTIONS.find((s) => s.key === params.get('bolum')) ?? SECTIONS[0];
    const choose = (key: string) => setParams({ bolum: key }, { replace: true });

    if (user?.role !== 'admin') {
        return (
            <div className="container py-4" style={{ maxWidth: 800 }}>
                <h2 className="mb-3">Ayarlar</h2>
                <div className="alert alert-warning">Ayarlar sayfasını yalnızca yöneticiler (Admin) kullanabilir.</div>
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ maxWidth: 1100 }}>
            <ToastContainer position="top-right" autoClose={3500} />
            <h2 className="mb-4">Ayarlar</h2>

            <div className="row g-4">
                {/* Phones: one dropdown */}
                <div className="col-12 d-md-none">
                    <select className="form-select" value={open.key} onChange={(e) => choose(e.target.value)} aria-label="Ayar bölümü">
                        {GROUPS.map((g) => (
                            <optgroup key={g} label={g}>
                                {SECTIONS.filter((s) => s.group === g).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Desktop: grouped navigation */}
                <nav className="col-md-3 d-none d-md-block" aria-label="Ayar bölümleri">
                    {GROUPS.map((g) => (
                        <div key={g} className="mb-3">
                            <div className="text-uppercase text-muted fw-semibold small px-2 mb-1">{g}</div>
                            <div className="list-group">
                                {SECTIONS.filter((s) => s.group === g).map((s) => {
                                    const Icon = s.icon;
                                    const active = s.key === open.key;
                                    return (
                                        <button
                                            key={s.key}
                                            type="button"
                                            className={`list-group-item list-group-item-action d-flex align-items-center gap-2${active ? ' active' : ''}`}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={() => choose(s.key)}
                                        >
                                            <Icon size={16} />{s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <section className="col-12 col-md-9" data-testid="settings-section">
                    <h4 className="mb-1">{open.label}</h4>
                    <p className="text-muted small mb-3">{open.description}</p>
                    {open.render()}
                </section>
            </div>
        </div>
    );
};

export default Settings;
