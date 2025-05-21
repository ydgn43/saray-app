import { useEffect, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import debounce from 'lodash.debounce';
import { unparse } from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';


type Student = {
    studentid: number;
    first_name: string;
    last_name: string;
    birth_date: string;
    season_year: string;
    class_name: string;
};

const Settings = () => {
    const [students, setStudents] = useState<Student[]>([]);

    // Form fields
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [birth_date, setBirthDate] = useState('');
    const [season_year, setSeason] = useState('');
    const [class_name, setClassName] = useState('');

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setSearchTerm(value);
        }, 300),
        [] // ✅ stable reference
    );


    const loadStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/student');
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error('Talebe listesi alınamadı:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id: number) => {
        const handleDelete = (id: number) => {
            confirmAlert({
                title: 'Silme Onayı',
                message: 'Bu talebeyi silmek istediğinize emin misiniz?',
                buttons: [
                    {
                        label: 'Evet',
                        onClick: () => performDelete(id),
                    },
                    {
                        label: 'Hayır',
                        onClick: () => { }, // do nothing
                    },
                ],
            });
        };

        const performDelete = async (id: number) => {
            try {
                const res = await fetch(`http://localhost:3001/student/delete?studentid=${id}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    if (res.status === 409 || res.status === 500) {
                        toast.error('Talebenin yoklama verisi mevcut. Önce yoklamaları silin.');
                    } else {
                        toast.error('Silme işlemi başarısız oldu.');
                    }
                    return;
                }

                toast.success('Talebe silindi');
                loadStudents();
            } catch (err) {
                console.error(err);
                toast.error('Silme işlemi sırasında hata oluştu');
            }
        };
        handleDelete(id);
    };

    const performAddStudent = async () => {
        setAdding(true);
        try {
            const res = await fetch('http://localhost:3001/student/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    birth_date,
                    season_year,
                    class_name,
                }),
            });

            if (!res.ok) throw new Error('Ekleme başarısız');
            toast.success('Talebe başarıyla eklendi');

            setFirstName('');
            setLastName('');
            setBirthDate('');
            setSeason('');
            setClassName('');

            loadStudents();
            setShowAddModal(false);
        } catch (err) {
            console.error(err);
            toast.error('Talebe eklenirken hata oluştu');
        } finally {
            setAdding(false);
        }
    };


    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!first_name || !last_name || !birth_date || !season_year || !class_name) {
            toast.error('Lütfen tüm alanları doldurun.');
            return;
        }

        setShowAddModal(false); // ✅ Close the modal BEFORE showing confirm

        confirmAlert({
            title: 'Ekleme Onayı',
            message: 'Yeni talebeyi eklemek istediğinize emin misiniz?',
            buttons: [
                {
                    label: 'Evet',
                    onClick: () => performAddStudent(),
                },
                {
                    label: 'Hayır',
                    onClick: () => {
                        setShowAddModal(true); // ✅ Reopen the modal if cancelled
                    },
                },
            ],
        });
    };




    useEffect(() => {
        loadStudents();
    }, []);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedClass, selectedSeason]);


    const filteredStudents = students.filter((s) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.class_name?.toLowerCase().includes(term) ||
            s.season_year?.toLowerCase().includes(term);
        const matchesClass = selectedClass ? s.class_name === selectedClass : true;
        const matchesSeason = selectedSeason ? s.season_year === selectedSeason : true;
        return matchesSearch && matchesClass && matchesSeason;
    });

    const indexOfLast = currentPage * studentsPerPage;
    const indexOfFirst = indexOfLast - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    const handleExportCSV = () => {
        if (filteredStudents.length === 0) {
            toast.info("Dışa aktarılacak öğrenci bulunamadı.");
            return;
        }

        const dataToExport = filteredStudents.map((s) => ({
            ID: s.studentid,
            Isim: s.first_name,
            Soyisim: s.last_name,
            Sinif: s.class_name,
            Sezon: s.season_year,
            DogumTarihi: s.birth_date,
        }));

        const csv = unparse(dataToExport);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'talebeler.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (

        <Layout>
            <div className="container" style={{ marginTop: '2rem' }}>
                <h1 className="mb-4">Talebe Ayarları</h1>
                <ToastContainer position="top-right" autoClose={3000} />

                <h1>Ayarlar</h1>


                <h3 className="d-flex justify-content-between align-items-center">
                    Mevcut Talebeler
                    <span className="badge bg-info text-dark">
                        Toplam: {filteredStudents.length}
                    </span>
                </h3>
                <div className="mb-3 d-flex flex-wrap gap-2">
                    {[
                        "kuranikerim",
                        "hazirlik",
                        "ibtidai",
                        "ihzari",
                        "mezun tekamul alti",
                        "tekamul alti"
                    ].map((className) => {
                        const count = filteredStudents.filter((s) => s.class_name === className).length;
                        return (
                            <span key={className} className="badge bg-primary">
                                {className}: {count}
                            </span>
                        );
                    })}
                </div>



                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="İsim, soyisim, sınıf veya sezon ile ara..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                debouncedSearch(e.target.value);
                            }}
                        />
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                <option value="">Tüm Sınıflar</option>
                                <option value="kuranikerim">Kuran-ı Kerim</option>
                                <option value="hazirlik">Hazırlık</option>
                                <option value="ibtidati">İbtidati</option>
                                <option value="ihzari">İhzari</option>
                                <option value="mevzun_tekamul_alti">Mezun Tekamul Altı</option>
                                <option value="tekamul_alti">Tekamul Altı</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <select className="form-select" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                                <option value="">Tüm Sezonlar</option>
                                {Array.from({ length: 33 }).map((_, i) => {
                                    const year = 2018 + i;
                                    const season = `${year}/${year + 1}`;
                                    return (
                                        <option key={season} value={season}>
                                            {season}
                                        </option>
                                    );
                                })}
                            </select>

                            <div className="d-flex justify-content-end mb-2">
                                <button className="btn btn-outline-success btn-sm" onClick={handleExportCSV}>
                                    CSV Olarak Dışa Aktar
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {(selectedClass || selectedSeason) && (
                    <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
                        {selectedClass && (
                            <span className="badge bg-secondary d-flex align-items-center">
                                {selectedClass}
                                <button
                                    type="button"
                                    className="btn-close btn-close-white btn-sm ms-2"
                                    aria-label="Sınıf filtresini kaldır"
                                    onClick={() => setSelectedClass('')}
                                ></button>
                            </span>
                        )}
                        {selectedSeason && (
                            <span className="badge bg-info text-dark d-flex align-items-center">
                                {selectedSeason}
                                <button
                                    type="button"
                                    className="btn-close btn-close-dark btn-sm ms-2"
                                    aria-label="Sezon filtresini kaldır"
                                    onClick={() => setSelectedSeason('')}
                                ></button>
                            </span>
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {showAddModal && (
                        <motion.div
                            className="modal show fade d-block"
                            tabIndex={-1}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="modal-dialog" role="document">
                                <div className="modal-content">
                                    <form onSubmit={handleAddStudent}>
                                        <div className="modal-header">
                                            <h5 className="modal-title">Yeni Talebe Ekle</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setShowAddModal(false)}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {/* Form fields */}
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label>İsim</label>
                                                    <input className="form-control" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label>Soyisim</label>
                                                    <input className="form-control" value={last_name} onChange={(e) => setLastName(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label>Doğum Tarihi</label>
                                                    <input type="date" className="form-control" value={birth_date} onChange={(e) => setBirthDate(e.target.value)} />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label>Sezon</label>
                                                    <select className="form-select" value={season_year} onChange={(e) => setSeason(e.target.value)}>
                                                        <option value="">Sezon Seç</option>
                                                        {Array.from({ length: 33 }).map((_, i) => {
                                                            const year = 2018 + i;
                                                            return (
                                                                <option key={year} value={`${year}/${year + 1}`}>
                                                                    {year}/{year + 1}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label>Sınıf Adı</label>
                                                    <select className="form-select" value={class_name} onChange={(e) => setClassName(e.target.value)}>
                                                        <option value="">Sınıf Seç</option>
                                                        <option value="kuranikerim">Kuran-ı Kerim</option>
                                                        <option value="hazirlik">Hazırlık</option>
                                                        <option value="ibtidati">İbtidati</option>
                                                        <option value="ihzari">İhzari</option>
                                                        <option value="mevzun_tekamul_alti">Mezun Tekamul Altı</option>
                                                        <option value="tekamul_alti">Tekamul Altı</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-success" disabled={adding}>
                                                {adding ? 'Ekleniyor...' : 'Ekle'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowAddModal(false)}
                                            >
                                                Vazgeç
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {showEditModal && editingStudent && (
                        <motion.div
                            className="modal show fade d-block"
                            tabIndex={-1}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <form onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); confirmAlert({ title: 'Düzenleme Onayı', message: 'Talebe bilgilerini güncellemek istiyor musunuz?', buttons: [{ label: 'Evet', onClick: async () => { try { const res = await fetch('http://192.168.50.120:3001/student', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent), }); if (!res.ok) throw new Error(); toast.success("Talebe bilgileri güncellendi"); setEditingStudent(null); loadStudents(); } catch { toast.error("Güncelleme başarısız"); } }, }, { label: 'Hayır', onClick: () => setShowEditModal(true) }] }); }}>
                                        <div className="modal-header">
                                            <h5 className="modal-title">Talebe Bilgilerini Güncelle</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => {
                                                    setShowEditModal(false);
                                                    setEditingStudent(null);
                                                }}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {/* Form fields for editing */}
                                            <div className="mb-3">
                                                <label>İsim</label>
                                                <input className="form-control" value={editingStudent.first_name} onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })} />
                                            </div>
                                            <div className="mb-3">
                                                <label>Soyisim</label>
                                                <input className="form-control" value={editingStudent.last_name} onChange={(e) => setEditingStudent({ ...editingStudent, last_name: e.target.value })} />
                                            </div>
                                            <div className="mb-3">
                                                <label>Doğum Tarihi</label>
                                                <input type="date" className="form-control" value={editingStudent.birth_date} onChange={(e) => setEditingStudent({ ...editingStudent, birth_date: e.target.value })} />
                                            </div>
                                            <div className="mb-3">
                                                <label>Sezon</label>
                                                <select className="form-select" value={editingStudent.season_year} onChange={(e) => setEditingStudent({ ...editingStudent, season_year: e.target.value })}>
                                                    <option value="">Sezon Seç</option>
                                                    {Array.from({ length: 33 }).map((_, i) => {
                                                        const year = 2018 + i;
                                                        return (
                                                            <option key={year} value={`${year}/${year + 1}`}>
                                                                {year}/{year + 1}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label>Sınıf</label>
                                                <select className="form-select" value={editingStudent.class_name} onChange={(e) => setEditingStudent({ ...editingStudent, class_name: e.target.value })}>
                                                    <option value="">Sınıf Seç</option>
                                                    <option value="kuranikerim">Kuran-ı Kerim</option>
                                                    <option value="hazirlik">Hazırlık</option>
                                                    <option value="ibtidati">İbtidati</option>
                                                    <option value="ihzari">İhzari</option>
                                                    <option value="mevzun_tekamul_alti">Mezun Tekamul Altı</option>
                                                    <option value="tekamul_alti">Tekamul Altı</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-success">Güncelle</button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    setShowEditModal(false);
                                                    setEditingStudent(null);
                                                }}
                                            >
                                                Vazgeç
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {(showAddModal || showEditModal) && (
                        <motion.div
                            className="modal-backdrop fade show"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </AnimatePresence>


                {loading ? (
                    <div className="text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>İsim</th>
                                    <th>Soyisim</th>
                                    <th>Sınıf</th>
                                    <th>Sezon</th>
                                    <th>Doğum Tarihi</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <motion.tbody
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                        },
                                    },
                                }}
                            >
                                {currentStudents.map((s, index) => (
                                    <motion.tr
                                        key={s.studentid}
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            visible: { opacity: 1, y: 0 },
                                        }}
                                    >
                                        <td>{indexOfFirst + index + 1}</td>
                                        <td>{s.first_name}</td>
                                        <td>{s.last_name}</td>
                                        <td>{s.class_name}</td>
                                        <td>{s.season_year}</td>
                                        <td>{s.birth_date}</td>
                                        <td>
                                            <button className="btn btn-warning btn-sm me-2" onClick={() => { setEditingStudent(s); setShowEditModal(true); }}>Düzenle</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.studentid)}>Sil</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>


                        </table>
                    </div>

                )}
                {totalPages > 1 && (
                    <motion.div
                        className="d-flex justify-content-center align-items-center my-3 gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            ← Geri
                        </button>
                        <span>Sayfa {currentPage} / {totalPages}</span>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            İleri →
                        </button>
                    </motion.div>
                )}

                <div className="d-flex justify-content-end mb-3">
                    <motion.button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        Yeni Talebe Ekle
                    </motion.button>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
