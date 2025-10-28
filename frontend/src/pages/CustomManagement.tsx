// src/pages/CustomManagement.tsx
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import { motion } from 'framer-motion';
import { convertToDbName } from '../constants';

const API = config.API_BASE_URL; // Use centralized configuration

type Entry = string;

interface Program {
    program_name: string;
    display_name?: string | null;
    display_order?: number | null;
}

interface Class {
    class_name: string;
    display_name?: string | null;
    display_order?: number | null;
}

const CustomManagement = () => {
    const [seasons, setSeasons] = useState<Entry[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);

    const [newSeason, setNewSeason] = useState('');
    const [newProgram, setNewProgram] = useState('');
    const [newClass, setNewClass] = useState('');

    const [editingItem, setEditingItem] = useState<{ type: string; oldValue: string; newValue: string } | null>(null);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const [s, p, c] = await Promise.all([
                authFetch(`${API}/season`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
                authFetch(`${API}/program`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
                authFetch(`${API}/class`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
            ]);
            setSeasons(s.map((x: any) => x.season_year));
            // Programs and classes are already sorted by display_order from backend
            setPrograms(p);
            setClasses(c);
        } catch {
            toast.error("Veriler alınamadı.");
        }
    };

    const addEntry = async (type: 'season' | 'program' | 'class', value: string) => {
        if (!value) return;
        try {
            const token = localStorage.getItem('token');
            let body: any = {};
            if (type === 'season') body = { season_year: value };
            else if (type === 'program') {
                // Convert display name to database name before sending
                const dbName = convertToDbName(value);
                body = { program_name: dbName, display_name: value };
            }
            else if (type === 'class') {
                // Convert display name to database name before sending
                const dbName = convertToDbName(value);
                body = { class_name: dbName, display_name: value };
            }

            const res = await authFetch(`${API}/${type}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error();
            toast.success(`${type} eklendi`);

            // Clear input after successful add
            if (type === 'season') setNewSeason('');
            else if (type === 'program') setNewProgram('');
            else if (type === 'class') setNewClass('');

            fetchAll();

            // Refresh page to show new entry across the app
            setTimeout(() => window.location.reload(), 1000);
        } catch {
            toast.error(`${type} eklenemedi`);
        }
    };

    const updateEntry = async () => {
        if (!editingItem) return;
        const { type, oldValue, newValue } = editingItem;

        if (!newValue || newValue === oldValue) {
            setEditingItem(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            let body: any = {};
            let urlOldValue = oldValue;

            if (type === 'season') body = { season_year: newValue };
            else if (type === 'program') {
                // oldValue is program_name, newValue is display_name
                body = { display_name: newValue };
            }
            else if (type === 'class') {
                // oldValue is class_name, newValue is display_name
                body = { display_name: newValue };
            }

            const res = await authFetch(`${API}/${type}/update/${urlOldValue}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error();
            toast.success(`${type} güncellendi`);
            setEditingItem(null);
            fetchAll();

            // Refresh page to show updated entry across the app
            setTimeout(() => window.location.reload(), 1000);
        } catch {
            toast.error(`${type} güncellenemedi`);
        }
    };

    const deleteEntry = async (type: 'season' | 'program' | 'class', value: string) => {
        if (!window.confirm(`"${value}" silmek istediğinize emin misiniz?`)) return;

        try {
            const token = localStorage.getItem('token');
            // URL encode the value to handle special characters like /
            const encodedValue = encodeURIComponent(value);
            const res = await authFetch(`${API}/${type}/delete/${encodedValue}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            toast.success(`${type} silindi`);
            fetchAll();

            // Refresh page to update dropdowns across the app
            setTimeout(() => window.location.reload(), 1000);
        } catch {
            toast.error(`${type} silinemedi`);
        }
    };

    // Move program up/down in order
    const moveProgramOrder = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === programs.length - 1) return;

        const newPrograms = [...programs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap items
        [newPrograms[index], newPrograms[targetIndex]] = [newPrograms[targetIndex], newPrograms[index]];

        // Update display_order for all items
        const updatedPrograms = newPrograms.map((prog, idx) => ({
            program_name: prog.program_name,
            display_order: idx + 1
        }));

        try {
            const token = localStorage.getItem('token');
            const res = await authFetch(`${API}/program/update-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ programs: updatedPrograms }),
            });

            if (!res.ok) throw new Error();
            toast.success('Program sıralaması güncellendi');
            setPrograms(newPrograms);
        } catch {
            toast.error('Sıralama güncellenemedi');
        }
    };

    // Move class up/down in order
    const moveClassOrder = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === classes.length - 1) return;

        const newClasses = [...classes];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap items
        [newClasses[index], newClasses[targetIndex]] = [newClasses[targetIndex], newClasses[index]];

        // Update display_order for all items
        const updatedClasses = newClasses.map((cls, idx) => ({
            class_name: cls.class_name,
            display_order: idx + 1
        }));

        try {
            const token = localStorage.getItem('token');
            const res = await authFetch(`${API}/class/update-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ classes: updatedClasses }),
            });

            if (!res.ok) throw new Error();
            toast.success('Dahili Seviye sıralaması güncellendi');
            setClasses(newClasses);
        } catch {
            toast.error('Sıralama güncellenemedi');
        }
    };

    // Render table for programs
    const renderProgramTable = () => (
        <motion.div
            className="card mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Programlar</h5>
            </div>
            <div className="card-body">
                <div className="alert alert-info small mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Yukarı/aşağı okları kullanarak programların sıralamasını değiştirebilirsiniz. Bu sıralama Yoklama sayfasında görünür.
                </div>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Yeni program giriniz (örn: Sabah Namazı)"
                        value={newProgram}
                        onChange={(e) => setNewProgram(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addEntry('program', newProgram)}
                    />
                    <button className="btn btn-success" onClick={() => addEntry('program', newProgram)}>
                        <i className="bi bi-plus-circle me-1"></i>Ekle
                    </button>
                </div>
                {newProgram && (
                    <div className="text-muted small mb-2">
                        Veritabanında: <code>{convertToDbName(newProgram)}</code>
                    </div>
                )}
                {programs.length === 0 ? (
                    <p className="text-muted text-center">Henüz program eklenmedi.</p>
                ) : (
                    <ul className="list-group">
                        {programs.map((item, i) => {
                            const displayValue = item.display_name || item.program_name;

                            return (
                                <motion.li
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {editingItem?.type === 'program' && editingItem?.oldValue === item.program_name ? (
                                        <div className="input-group input-group-sm flex-grow-1 me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingItem.newValue}
                                                onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && updateEntry()}
                                                autoFocus
                                            />
                                            <button className="btn btn-sm btn-primary" onClick={updateEntry}>
                                                Kaydet
                                            </button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingItem(null)}>
                                                İptal
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>
                                                <span className="badge bg-secondary me-2">{i + 1}</span>
                                                {displayValue}
                                                <small className="text-muted ms-2">({item.program_name})</small>
                                            </span>
                                            <div className="d-flex gap-1">
                                                {/* Order buttons */}
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => moveProgramOrder(i, 'up')}
                                                    disabled={i === 0}
                                                    title="Yukarı taşı"
                                                >
                                                    <i className="bi bi-arrow-up"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => moveProgramOrder(i, 'down')}
                                                    disabled={i === programs.length - 1}
                                                    title="Aşağı taşı"
                                                >
                                                    <i className="bi bi-arrow-down"></i>
                                                </button>
                                                {/* Edit button */}
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setEditingItem({ type: 'program', oldValue: item.program_name, newValue: displayValue })}
                                                    title="Düzenle"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                {/* Delete button */}
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteEntry('program', item.program_name)}
                                                    title="Sil"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </motion.div>
    );

    // Render table for classes
    const renderClassTable = () => (
        <motion.div
            className="card mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Dahili Seviyeler</h5>
            </div>
            <div className="card-body">
                <div className="alert alert-info small mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Yukarı/aşağı okları kullanarak dahili seviyelerin sıralamasını değiştirebilirsiniz. Bu sıralama tablolarda ve listelerde görünür.
                </div>
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Yeni dahili seviye giriniz (örn: Kur'an-ı Kerim)"
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addEntry('class', newClass)}
                    />
                    <button className="btn btn-success" onClick={() => addEntry('class', newClass)}>
                        <i className="bi bi-plus-circle me-1"></i>Ekle
                    </button>
                </div>
                {newClass && (
                    <div className="text-muted small mb-2">
                        Veritabanında: <code>{convertToDbName(newClass)}</code>
                    </div>
                )}
                {classes.length === 0 ? (
                    <p className="text-muted text-center">Henüz dahili seviye eklenmedi.</p>
                ) : (
                    <ul className="list-group">
                        {classes.map((item, i) => {
                            const displayValue = item.display_name || item.class_name;

                            return (
                                <motion.li
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {editingItem?.type === 'class' && editingItem?.oldValue === item.class_name ? (
                                        <div className="input-group input-group-sm flex-grow-1 me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingItem.newValue}
                                                onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && updateEntry()}
                                                autoFocus
                                            />
                                            <button className="btn btn-sm btn-primary" onClick={updateEntry}>
                                                Kaydet
                                            </button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingItem(null)}>
                                                İptal
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>
                                                <span className="badge bg-secondary me-2">{i + 1}</span>
                                                {displayValue}
                                                <small className="text-muted ms-2">({item.class_name})</small>
                                            </span>
                                            <div className="d-flex gap-1">
                                                {/* Order buttons */}
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => moveClassOrder(i, 'up')}
                                                    disabled={i === 0}
                                                    title="Yukarı taşı"
                                                >
                                                    <i className="bi bi-arrow-up"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => moveClassOrder(i, 'down')}
                                                    disabled={i === classes.length - 1}
                                                    title="Aşağı taşı"
                                                >
                                                    <i className="bi bi-arrow-down"></i>
                                                </button>
                                                {/* Edit button */}
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setEditingItem({ type: 'class', oldValue: item.class_name, newValue: displayValue })}
                                                    title="Düzenle"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                {/* Delete button */}
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteEntry('class', item.class_name)}
                                                    title="Sil"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </motion.div>
    );

    const renderTable = (label: string, list: Entry[], type: 'season' | 'program' | 'class', onAdd: () => void, value: string, setValue: (v: string) => void) => (
        <motion.div
            className="card mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{label}</h5>
            </div>
            <div className="card-body">
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder={`Yeni ${label.toLowerCase()} giriniz`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
                    />
                    <button className="btn btn-success" onClick={onAdd}>
                        <i className="bi bi-plus-circle me-1"></i>Ekle
                    </button>
                </div>
                {list.length === 0 ? (
                    <p className="text-muted text-center">Henüz {label.toLowerCase()} eklenmedi.</p>
                ) : (
                    <ul className="list-group">
                        {list.map((item, i) => {
                            const displayValue = item;

                            return (
                                <motion.li
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {editingItem?.type === type && editingItem?.oldValue === item ? (
                                        <div className="input-group input-group-sm flex-grow-1 me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingItem.newValue}
                                                onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && updateEntry()}
                                                autoFocus
                                                placeholder={type === 'program' ? 'Örn: Sabah Namazı' : ''}
                                            />
                                            <button className="btn btn-success btn-sm" onClick={updateEntry}>
                                                <i className="bi bi-check"></i>
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{displayValue}</span>
                                            <div>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => setEditingItem({ type, oldValue: item, newValue: displayValue })}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteEntry(type, item)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </motion.div>
    );

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <div className="container py-4">
            <ToastContainer />
            <h2 className="mb-4">Özel Yönetim</h2>
            <p className="text-muted mb-4">Sezon, Program ve Dahili Seviye bilgilerini ekleyin, düzenleyin veya silin.</p>
            {renderTable("Sezon", seasons, 'season', () => addEntry('season', newSeason), newSeason, setNewSeason)}
            {renderProgramTable()}
            {renderClassTable()}
        </div>
    );
};

export default CustomManagement;
