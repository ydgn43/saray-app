import React, { useEffect, useState, useRef } from 'react';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import config from '../config';

const PROGRAM_OPTIONS = [
    { value: 'sabah_namazi', label: 'Sabah Namazı' },
    { value: 'oglen_namazi', label: 'Öğle Namazı' },
    { value: 'ikindi_namazi', label: 'İkindi Namazı' },
    { value: 'aksam_namazi', label: 'Akşam Namazı' },
    { value: 'yatsi_namazi', label: 'Yatsı Namazı' },
    { value: 'hatim', label: 'Hatim' },
    { value: 'tum_gun', label: 'Tüm Gün' }
];

const IzinliTalebeler = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [izinliler, setIzinliler] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [date, setDate] = useState('');
    const [program, setProgram] = useState('');
    const [sebep, setSebep] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const shareBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        authFetch(`${config.API_BASE_URL}/student`)
            .then(res => res.json())
            .then(data => setStudents(Array.isArray(data) ? data : []));
    }, []);

    const fetchIzinliler = async () => {
        if (!date || !program) {
            setIzinliler([]);
            return;
        }
        setLoading(true);
        try {
            if (program === 'tum_gun') {
                const allPrograms = PROGRAM_OPTIONS.filter(p => p.value !== 'tum_gun').map(p => p.value);
                const izinliLists = await Promise.all(
                    allPrograms.map(async prog => {
                        const res = await authFetch(`${config.API_BASE_URL}
/attendance/izinli?date=${date}&program_name=${prog}`);
                        return res.json();
                    })
                );
                const izinliByStudent: { [studentid: string]: number } = {};
                izinliLists.forEach(list => {
                    if (Array.isArray(list)) {
                        list.forEach((r: any) => {
                            izinliByStudent[r.studentid] = (izinliByStudent[r.studentid] || 0) + 1;
                        });
                    }
                });
                const izinliAllPrograms = Object.entries(izinliByStudent)
                    .filter(([_, count]) => count === allPrograms.length)
                    .map(([studentid]) => parseInt(studentid));
                const izinliTalebeler = izinliAllPrograms.map(studentid => {
                    const record = Array.isArray(izinliLists[0]) ? izinliLists[0].find((r: any) => r.studentid === studentid) : null;
                    return record || { studentid };
                });
                setIzinliler(Array.isArray(izinliTalebeler) ? izinliTalebeler : []);
            } else {
                const res = await authFetch(`${config.API_BASE_URL}
/attendance/izinli?date=${date}&program_name=${program}`);
                const data = await res.json();
                setIzinliler(Array.isArray(data) ? data : []);
            }
        } catch {
            toast.error('İzinli listesi alınamadı.');
            setIzinliler([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIzinliler();
        // eslint-disable-next-line
    }, [date, program]);

    const handleAddIzinli = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudents.length === 0 || !date || !program) {
            toast.error('Tüm alanları doldurun.');
            return;
        }
        const allPrograms = PROGRAM_OPTIONS.filter(p => p.value !== 'tum_gun').map(p => p.value);

        try {
            setLoading(true);
            if (program === 'tum_gun') {
                await Promise.all(
                    selectedStudents.flatMap(studentid =>
                        allPrograms.map(prog =>
                            authFetch(`${config.API_BASE_URL}/attendance/create`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    studentid,
                                    date,
                                    program_name: prog,
                                    attendance_type_name: 'izinli',
                                    sebep
                                })
                            })
                        )
                    )
                );
            } else {
                await Promise.all(
                    selectedStudents.map(studentid =>
                        authFetch(`${config.API_BASE_URL}/attendance/create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                studentid,
                                date,
                                program_name: program,
                                attendance_type_name: 'izinli',
                                sebep
                            })
                        })
                    )
                );
            }
            setSelectedStudents([]);
            setSebep('');
            setShowModal(false);
            fetchIzinliler();
        } catch {
            toast.error('Kayıt başarısız.');
        } finally {
            setLoading(false);
        }
    };

    // Message formatting logic
    const getShareText = () => {
        const programLabel = PROGRAM_OPTIONS.find(p => p.value === program)?.label || program;
        const dateStr = new Date(date).toLocaleDateString('tr-TR');
        const list = izinliler.map((r: any, i: number) => {
            const stu = students.find(s => s.studentid === r.studentid);
            const name = stu ? `${stu.first_name} ${stu.last_name}` : `ID: ${r.studentid}`;
            return `${i + 1}. ${name}${r.sebep ? ` (${r.sebep})` : ''}`;
        }).join('\n');
        return `📅 ${dateStr}\n📌 ${programLabel}\n\n${list}`;
    };

    // Copy to clipboard
    const handleCopy = () => {
        const text = getShareText();
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text);
            toast.success('Kopyalandı!');
        } else {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                toast.success('Kopyalandı!');
            } catch {
                toast.error('Kopyalama başarısız.');
            }
            document.body.removeChild(textarea);
        }
        setShareMenuOpen(false);
    };

    // WhatsApp share
    const handleWhatsApp = () => {
        const text = getShareText();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        setShareMenuOpen(false);
    };

    // Close menu on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                shareBtnRef.current &&
                !shareBtnRef.current.contains(e.target as Node)
            ) {
                setShareMenuOpen(false);
            }
        }
        if (shareMenuOpen) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [shareMenuOpen]);

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 0' }}>
            <ToastContainer />
            <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 18 }}>İzinli Talebeler</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <input
                    type="date"
                    className="form-control"
                    style={{ width: 140, fontSize: 15, padding: '2px 8px' }}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
                <select
                    className="form-select"
                    style={{ width: 160, fontSize: 15, padding: '2px 8px' }}
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                >
                    <option value="">Program Seçin</option>
                    {PROGRAM_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
                {(user?.role === 'hoca' || user?.role === 'admin') && (
                    <button
                        className="btn btn-outline-success"
                        style={{ fontSize: 15, padding: '2px 16px', height: 34 }}
                        onClick={() => setShowModal(true)}
                    >
                        + İzinli Ekle
                    </button>
                )}
                <button
                    ref={shareBtnRef}
                    className="btn btn-outline-primary"
                    style={{ fontSize: 15, padding: '2px 16px', height: 34, position: 'relative' }}
                    onClick={() => setShareMenuOpen(v => !v)}
                    disabled={!date || !program || izinliler.length === 0}
                >
                    Paylaş
                </button>
                {shareMenuOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 40,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            zIndex: 10,
                            minWidth: 140
                        }}
                        tabIndex={-1}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="dropdown-item"
                            style={{
                                fontSize: 15,
                                padding: '8px 16px',
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseDown={handleCopy}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f2f2f2')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            Kopyala
                        </button>
                        <button
                            type="button"
                            className="dropdown-item"
                            style={{
                                fontSize: 15,
                                padding: '8px 16px',
                                width: '100%',
                                textAlign: 'left',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseDown={handleWhatsApp}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f2f2f2')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            WhatsApp ile Paylaş
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal show fade" style={{ display: 'block', background: 'rgba(0,0,0,0.15)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content" style={{ borderRadius: 10 }}>
                            <form className="modal-body" onSubmit={handleAddIzinli}>
                                <h5 className="modal-title mb-3" style={{ fontWeight: 500 }}>İzinli Talebe Ekle</h5>
                                <div className="mb-2">
                                    <label className="form-label">Tarih</label>
                                    <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Program</label>
                                    <select className="form-select" value={program} onChange={e => setProgram(e.target.value)} required>
                                        <option value="">Program Seçin</option>
                                        {PROGRAM_OPTIONS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Talebeler</label>
                                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
                                        {students.map(s => (
                                            <div key={s.studentid} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`student-${s.studentid}`}
                                                    value={s.studentid}
                                                    checked={selectedStudents.includes(s.studentid)}
                                                    onChange={e => {
                                                        const id = Number(s.studentid);
                                                        if (e.target.checked) {
                                                            setSelectedStudents(prev => [...prev, id]);
                                                        } else {
                                                            setSelectedStudents(prev => prev.filter(sid => sid !== id));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={`student-${s.studentid}`}>
                                                    {s.first_name} {s.last_name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Sebep (opsiyonel)</label>
                                    <input className="form-control" value={sebep} onChange={e => setSebep(e.target.value)} />
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-link" onClick={() => setShowModal(false)}>
                                        Kapat
                                    </button>
                                    <button className="btn btn-success" type="submit" disabled={loading}>Ekle</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ fontSize: 15, color: '#888', marginTop: 24 }}>Yükleniyor...</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 18 }}>
                    {Array.isArray(izinliler) && izinliler.length === 0 ? (
                        <li style={{ color: '#aaa', fontSize: 15 }}>İzinli talebe yok.</li>
                    ) : (
                        Array.isArray(izinliler) &&
                        izinliler.map((r: any) => (
                            <li key={r.studentid} style={{ fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500 }}>
                                    {students.find(s => s.studentid === r.studentid)?.first_name || 'Bilinmiyor'}{' '}
                                    {students.find(s => s.studentid === r.studentid)?.last_name || ''}
                                </span>
                                {r.sebep && <span style={{ color: '#888', fontSize: 14, marginLeft: 8 }}>({r.sebep})</span>}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default IzinliTalebeler;


