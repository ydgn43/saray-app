// src/pages/CustomManagement.tsx
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authFetch } from '../utils/authFetch';

const API = 'https://api.efendim.nl:3001'; // Adjust to match your backend

type Entry = string;

const CustomManagement = () => {
    const [seasons, setSeasons] = useState<Entry[]>([]);
    const [programs, setPrograms] = useState<Entry[]>([]);
    const [classes, setClasses] = useState<Entry[]>([]);

    const [newSeason, setNewSeason] = useState('');
    const [newProgram, setNewProgram] = useState('');
    const [newClass, setNewClass] = useState('');

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
            fetchAll();
        } catch {
            toast.error(`${type} eklenemedi`);
        }
    };

    const renderTable = (label: string, list: Entry[], onAdd: () => void, value: string, setValue: (v: string) => void) => (
        <div className="mb-4">
            <h5>{label}</h5>
            <div className="input-group mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder={`Yeni ${label.toLowerCase()} giriniz`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button className="btn btn-success" onClick={onAdd}>Ekle</button>
            </div>
            <ul className="list-group">
                {list.map((item, i) => (
                    <li className="list-group-item" key={i}>{item}</li>
                ))}
            </ul>
        </div>
    );

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <div>
            <ToastContainer />
            {renderTable("Sezon", seasons, () => addEntry('season', newSeason), newSeason, setNewSeason)}
            {renderTable("Program", programs, () => addEntry('program', newProgram), newProgram, setNewProgram)}
            {renderTable("Sınıf", classes, () => addEntry('class', newClass), newClass, setNewClass)}
        </div>
    );
};

export default CustomManagement;
