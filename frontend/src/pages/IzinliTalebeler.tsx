import React, { useEffect, useState, useRef } from 'react';
import { authFetch } from '../utils/authFetch';
import { useAuth } from '../auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import config from '../config';
import { useAttendanceReasons } from '../hooks/useAttendanceReasons';
import { prettifyClassName } from '../utils/classNames';

// "Tüm Gün" means every program of the yurt; the programs themselves come from Settings (/program)
const ALL_DAY = 'tum_gun';
const MAX_RANGE_DAYS = 60; // same limit as the server
const OTHER_SEBEP = '__diger';

interface ProgramInfo {
    program_name: string;
    display_name?: string | null;
}

interface RangePreview {
    days: number;
    total: number;
    created: number;
    replaced: number;
    already_izinli: number;
}

const todayLocal = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD in the user's time zone
const daysBetween = (start: string, end: string) =>
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;

const IzinliTalebeler = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [izinliler, setIzinliler] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [date, setDate] = useState('');
    const [program, setProgram] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<{ studentid: number; name: string; program: string } | null>(null);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const shareBtnRef = useRef<HTMLButtonElement>(null);

    // Programs of the selected yurt (Settings > Programlar, in Settings order)
    const [programs, setPrograms] = useState<ProgramInfo[]>([]);
    const programOptions = [
        ...programs.map(p => ({ value: p.program_name, label: p.display_name || prettifyClassName(p.program_name) })),
        { value: ALL_DAY, label: 'Tüm Gün' }
    ];
    const sebepList = useAttendanceReasons().filter(n => n.trim().toLowerCase() !== 'diğer');

    // "İzinli Ekle" window: its own date range, program and sebep
    const [addStart, setAddStart] = useState('');
    const [addEnd, setAddEnd] = useState('');
    const [addProgram, setAddProgram] = useState('');
    const [sebepChoice, setSebepChoice] = useState('');
    const [sebepText, setSebepText] = useState('');
    const [preview, setPreview] = useState<RangePreview | null>(null);
    const [previewError, setPreviewError] = useState('');

    useEffect(() => {
        authFetch(`${config.API_BASE_URL}/program`)
            .then(res => res.json())
            .then(data => setPrograms(Array.isArray(data) ? data : []))
            .catch(() => toast.error('Programlar yüklenemedi.'));
    }, []);

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
            if (program === ALL_DAY) {
                const allPrograms = programs.map(p => p.program_name);
                const izinliLists = await Promise.all(
                    allPrograms.map(async prog => {
                        const res = await authFetch(`${config.API_BASE_URL}/attendance/izinli?date=${date}&program_name=${prog}`);
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
                const res = await authFetch(`${config.API_BASE_URL}/attendance/izinli?date=${date}&program_name=${program}`);
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

    const finalSebep = sebepChoice === OTHER_SEBEP ? sebepText.trim() : sebepChoice;
    const rangeDays = addStart && addEnd ? daysBetween(addStart, addEnd) : 0;
    const rangeProblem =
        !addStart || !addEnd ? ''
        : rangeDays < 1 ? 'Bitiş tarihi başlangıç tarihinden önce olamaz.'
        : rangeDays > MAX_RANGE_DAYS ? `Tarih aralığı en fazla ${MAX_RANGE_DAYS} gün olabilir.`
        : '';

    const openAddModal = () => {
        const start = date || todayLocal();
        setAddStart(start);
        setAddEnd(start);
        setAddProgram(program);
        setSebepChoice('');
        setSebepText('');
        setPreview(null);
        setPreviewError('');
        setShowModal(true);
    };

    // The body sent to the server for the chosen range
    const rangeBody = (dryRun: boolean) => ({
        studentids: selectedStudents,
        start_date: addStart,
        end_date: addEnd,
        programs: addProgram === ALL_DAY ? 'all' : [addProgram],
        sebep: finalSebep,
        dry_run: dryRun
    });

    // Ask the server how many records the range would create and replace (nothing is saved)
    useEffect(() => {
        setPreview(null);
        setPreviewError('');
        if (!showModal || selectedStudents.length === 0 || !addStart || !addEnd || !addProgram || rangeProblem) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const res = await authFetch(`${config.API_BASE_URL}/attendance/izinli-range`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rangeBody(true))
                });
                const data = await res.json();
                if (cancelled) return;
                if (res.ok) setPreview(data);
                else setPreviewError(data?.message || 'Önizleme alınamadı.');
            } catch {
                if (!cancelled) setPreviewError('Önizleme alınamadı.');
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
        // eslint-disable-next-line
    }, [showModal, selectedStudents, addStart, addEnd, addProgram, rangeProblem]);

    const handleAddIzinli = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudents.length === 0 || !addStart || !addEnd || !addProgram) {
            toast.error('Tüm alanları doldurun.');
            return;
        }
        if (rangeProblem) {
            toast.error(rangeProblem);
            return;
        }
        try {
            setLoading(true);
            const res = await authFetch(`${config.API_BASE_URL}/attendance/izinli-range`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rangeBody(false))
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.message || 'Kayıt başarısız.');
                return;
            }
            toast.success(`${data.total} izinli kaydı eklendi.`);
            setSelectedStudents([]);
            setShowModal(false);
            // Show the result: the list switches to the start date and program of what was just added
            if (date === addStart && program === addProgram) {
                fetchIzinliler();
            } else {
                setDate(addStart);
                setProgram(addProgram);
            }
        } catch {
            toast.error('Kayıt başarısız.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIzinli = async () => {
        if (!studentToDelete || !date) return;

        try {
            setLoading(true);
            const allPrograms = programs.map(p => p.program_name);

            if (program === ALL_DAY) {
                // Delete from all programs
                await Promise.all(
                    allPrograms.map(prog =>
                        authFetch(`${config.API_BASE_URL}/attendance/delete?studentid=${studentToDelete.studentid}&date=${date}&program_name=${prog}`, {
                            method: 'DELETE'
                        })
                    )
                );
            } else {
                // Delete from single program
                await authFetch(`${config.API_BASE_URL}/attendance/delete?studentid=${studentToDelete.studentid}&date=${date}&program_name=${program}`, {
                    method: 'DELETE'
                });
            }

            toast.success('İzinli kaydı silindi.');
            setShowDeleteConfirm(false);
            setStudentToDelete(null);
            fetchIzinliler();

            // Refresh page to update attendance data
            setTimeout(() => window.location.reload(), 1000);
        } catch {
            toast.error('Silme işlemi başarısız.');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteConfirm = (studentid: number, studentName: string) => {
        setStudentToDelete({
            studentid,
            name: studentName,
            program: programOptions.find(p => p.value === program)?.label || program
        });
        setShowDeleteConfirm(true);
    };

    // Message formatting logic
    const getShareText = () => {
        const programLabel = programOptions.find(p => p.value === program)?.label || program;
        const dateStr = new Date(date).toLocaleDateString('tr-TR');
        const list = izinliler.map((r: any, i: number) => {
            const stu = students.find(s => s.studentid === r.studentid);
            const name = stu ? `${stu.first_name} ${stu.last_name}` : `ID: ${r.studentid}`;
            return `${i + 1}. ${name}${r.sebep ? ` (${r.sebep})` : ''}`;
        }).join('\n');
        return `Tarih: ${dateStr}\nProgram: ${programLabel}\n\n${list}`;
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
        <div className="container" style={{ padding: '0 12px', maxWidth: 1200 }}>
            <ToastContainer />
            <PageHeader
                icon=""
                title="İzinli Talebeler"
                subtitle="İzinli öğrencileri görüntüleyin ve yönetin"
                color="#1e40af"
            />

            {/* Filter Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card shadow border-0 mb-3"
                style={{
                    borderRadius: '12px'
                }}
            >
                <div className="card-body p-2 p-md-3">
                    <div className="row g-2 mb-2">
                        <div className="col-6 col-md-4">
                            <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Tarih</label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="col-6 col-md-4">
                            <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Program</label>
                            <select
                                className="form-select form-select-sm"
                                value={program}
                                onChange={e => setProgram(e.target.value)}
                            >
                                <option value="">Program Seçin</option>
                                {programOptions.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-md-4 d-flex align-items-end gap-2">
                            {(user?.role === 'hoca' || user?.role === 'admin') && (
                                <button
                                    className="btn btn-light btn-sm flex-grow-1"
                                    style={{
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                        border: 'none',
                                        color: 'white'
                                    }}
                                    onClick={openAddModal}
                                >
                                    İzinli Ekle
                                </button>
                            )}
                            <div style={{ position: 'relative' }}>
                                <button
                                    ref={shareBtnRef}
                                    className="btn btn-light btn-sm"
                                    style={{
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                    onClick={() => setShareMenuOpen(v => !v)}
                                    disabled={!date || !program || izinliler.length === 0}
                                >
                                    Paylaş
                                </button>
                                {shareMenuOpen && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '4px',
                                            background: '#fff',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            zIndex: 10,
                                            minWidth: 160
                                        }}
                                        tabIndex={-1}
                                        onMouseDown={e => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className="dropdown-item"
                                            style={{
                                                fontSize: '0.85rem',
                                                padding: '8px 16px',
                                                width: '100%',
                                                textAlign: 'left',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                borderRadius: '8px 8px 0 0'
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
                                                fontSize: '0.85rem',
                                                padding: '8px 16px',
                                                width: '100%',
                                                textAlign: 'left',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                borderRadius: '0 0 8px 8px'
                                            }}
                                            onMouseDown={handleWhatsApp}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#f2f2f2')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        >
                                            WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal show fade d-block"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-content" style={{ borderRadius: '12px', border: 'none' }}>
                                <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                                    <h5 className="modal-title" style={{ fontWeight: '600', color: '#1e40af' }}>
                                        İzinli Talebe Ekle
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <form className="modal-body p-3" onSubmit={handleAddIzinli}>
                                    <div className="row g-2 mb-1">
                                        <div className="col-6">
                                            <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Başlangıç</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                aria-label="Başlangıç tarihi"
                                                value={addStart}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    setAddStart(v);
                                                    // keep the end date from falling behind the start date
                                                    if (!addEnd || addEnd < v) setAddEnd(v);
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Bitiş</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                aria-label="Bitiş tarihi"
                                                value={addEnd}
                                                min={addStart || undefined}
                                                onChange={e => setAddEnd(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3" style={{ fontSize: '0.8rem' }}>
                                        {rangeProblem ? (
                                            <span className="text-danger" data-testid="range-problem">{rangeProblem}</span>
                                        ) : rangeDays > 0 ? (
                                            <span className="text-muted">
                                                {rangeDays === 1 ? 'Tek gün' : `${rangeDays} gün`} (başlangıç ve bitiş dahil, hafta sonları dahil)
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Program</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={addProgram}
                                            onChange={e => setAddProgram(e.target.value)}
                                            required
                                        >
                                            <option value="">Program Seçin</option>
                                            {programOptions.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Talebeler</label>
                                        <div
                                            className="border rounded"
                                            style={{
                                                maxHeight: 240,
                                                overflowY: 'auto',
                                                padding: '8px',
                                                backgroundColor: '#f8f9fa'
                                            }}
                                        >
                                            {students.map(s => (
                                                <div key={s.studentid} className="form-check mb-1">
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
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`student-${s.studentid}`}
                                                        style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                                                    >
                                                        {s.first_name} {s.last_name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Sebep (opsiyonel)</label>
                                        <select
                                            className="form-select form-select-sm"
                                            aria-label="Sebep"
                                            value={sebepChoice}
                                            onChange={e => setSebepChoice(e.target.value)}
                                        >
                                            <option value="">Sebep yok</option>
                                            {sebepList.map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                            <option value={OTHER_SEBEP}>Diğer</option>
                                        </select>
                                        {sebepChoice === OTHER_SEBEP && (
                                            <input
                                                className="form-control form-control-sm mt-2"
                                                aria-label="Diğer sebep"
                                                value={sebepText}
                                                maxLength={255}
                                                onChange={e => setSebepText(e.target.value)}
                                                placeholder="İzin sebebini giriniz..."
                                            />
                                        )}
                                    </div>
                                    {(preview || previewError) && (
                                        <div
                                            className={`mb-3 p-2 border ${previewError ? 'text-danger' : preview && preview.replaced > 0 ? 'text-dark' : 'text-muted'}`}
                                            style={{ fontSize: '0.8rem', borderRadius: '8px', backgroundColor: '#f8f9fa' }}
                                            data-testid="range-preview"
                                        >
                                            {previewError ? previewError : preview && (
                                                <>
                                                    {preview.total} kayıt kaydedilecek.
                                                    {preview.replaced > 0 && <> <strong>{preview.replaced} mevcut yoklama kaydı izinli ile değiştirilecek.</strong></>}
                                                    {preview.already_izinli > 0 && <> {preview.already_izinli} kayıt zaten izinli.</>}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-sm"
                                            onClick={() => setShowModal(false)}
                                            style={{
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                fontWeight: '600',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            İptal
                                        </button>
                                        <button
                                            className="btn btn-success btn-sm"
                                            type="submit"
                                            disabled={loading || !!rangeProblem}
                                            style={{
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                                border: 'none'
                                            }}
                                        >
                                            {loading ? 'Ekleniyor...' : 'Ekle'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && studentToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal show fade d-block"
                        style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered modal-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-content" style={{ borderRadius: '12px', border: 'none' }}>
                                <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                                    <h5 className="modal-title" style={{ fontWeight: '600', color: '#dc2626', fontSize: '1rem' }}>
                                        İzinli Kaydını Sil
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-3">
                                    <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <strong>{studentToDelete.name}</strong> adlı talebenin <strong>{studentToDelete.program}</strong> programındaki izinli kaydını silmek istediğinize emin misiniz?
                                    </p>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                                        Bu işlem geri alınamaz.
                                    </p>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '12px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-light btn-sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontWeight: '600',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        onClick={handleDeleteIzinli}
                                        disabled={loading}
                                        style={{
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                            border: 'none',
                                            color: 'white'
                                        }}
                                    >
                                        {loading ? 'Siliniyor...' : 'Sil'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card shadow-sm border-0"
                style={{ borderRadius: '12px' }}
            >
                <div className="card-body p-3">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                        </div>
                    ) : Array.isArray(izinliler) && izinliler.length === 0 ? (
                        <div className="alert alert-info text-center mb-0" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                            İzinli talebe bulunamadı
                        </div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0" style={{ fontWeight: '600', color: '#1e40af', fontSize: '0.95rem' }}>
                                    İzinli Listesi
                                </h6>
                                <span className="badge bg-danger" style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                                    {izinliler.length} Talebe
                                </span>
                            </div>
                            <div className="list-group">
                                {Array.isArray(izinliler) &&
                                    izinliler.map((r: any, index: number) => {
                                        const student = students.find(s => s.studentid === r.studentid);
                                        return (
                                            <motion.div
                                                key={r.studentid}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="list-group-item border-0 mb-2"
                                                style={{
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f8f9fa',
                                                    padding: '12px'
                                                }}
                                            >
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="flex-grow-1">
                                                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333' }}>
                                                            {index + 1}. {student?.first_name || 'Bilinmiyor'}{' '}
                                                            {student?.last_name || ''}
                                                        </span>
                                                        {r.sebep && (
                                                            <span
                                                                className="d-block text-muted"
                                                                style={{ fontSize: '0.75rem', marginTop: '4px' }}
                                                            >
                                                                {r.sebep}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                                                            İzinli
                                                        </span>
                                                        {(user?.role === 'hoca' || user?.role === 'admin') && (
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                    color: '#dc2626',
                                                                    borderRadius: '6px',
                                                                    padding: '4px 10px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onClick={() => openDeleteConfirm(r.studentid, `${student?.first_name || ''} ${student?.last_name || ''}`)}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                                }}
                                                                title="İzinli kaydını sil"
                                                            >
                                                                Sil
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default IzinliTalebeler;


