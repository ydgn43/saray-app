// src/pages/CustomManagement.tsx
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import { motion } from 'framer-motion';

const API = config.API_BASE_URL; // Use centralized configuration

type Entry = string;

const CustomManagement = () => {
    const [seasons, setSeasons] = useState<Entry[]>([]);
    const [programs, setPrograms] = useState<Entry[]>([]);
    const [classes, setClasses] = useState<Entry[]>([]);

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
            setPrograms(p.map((x: any) => x.program_name));
            setClasses(c.map((x: any) => x.class_name));
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
            else if (type === 'program') body = { program_name: value };
            else if (type === 'class') body = { class_name: value };

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
            if (type === 'season') body = { season_year: newValue };
            else if (type === 'program') body = { program_name: newValue };
            else if (type === 'class') body = { class_name: newValue };

            const res = await authFetch(`${API}/${type}/update/${oldValue}`, {
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
        } catch {
            toast.error(`${type} güncellenemedi`);
        }
    };

    const deleteEntry = async (type: 'season' | 'program' | 'class', value: string) => {
        if (!window.confirm(`"${value}" silmek istediğinize emin misiniz?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await authFetch(`${API}/${type}/delete/${value}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            toast.success(`${type} silindi`);
            fetchAll();
        } catch {
            toast.error(`${type} silinemedi`);
        }
    };

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
                        {list.map((item, i) => (
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
                                        <span>{item}</span>
                                        <div>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => setEditingItem({ type, oldValue: item, newValue: item })}
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
                        ))}
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
            {renderTable("Program", programs, 'program', () => addEntry('program', newProgram), newProgram, setNewProgram)}
            {renderTable("Dahili Seviye", classes, 'class', () => addEntry('class', newClass), newClass, setNewClass)}
        </div>
    );
};

export default CustomManagement;
