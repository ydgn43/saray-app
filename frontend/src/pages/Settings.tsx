import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import debounce from 'lodash.debounce';
import { unparse } from 'papaparse';


import { useCallback } from 'react';


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

        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} />

            <h1>Ayarlar</h1>


            <h3>Mevcut Talebeler</h3>
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
                    <select
                        className="form-select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
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
                    <select
                        className="form-select"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
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

                </div>
                <div className="d-flex justify-content-end mb-2">
                    <button className="btn btn-outline-success btn-sm" onClick={handleExportCSV}>
                        CSV Olarak Dışa Aktar
                    </button>
                </div>

            </div>
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

            {showAddModal && (
                <div className="modal show fade d-block" tabIndex={-1} role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <form
                                onSubmit={handleAddStudent}
                            >
                                <div className="modal-header">
                                    <h5 className="modal-title">Yeni Talebe Ekle</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowAddModal(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
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
                </div>
            )}

            {loading ? (
                <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            ) : (
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>İsim</th>
                            <th>Soyisim</th>
                            <th>Sınıf</th>
                            <th>Sezon</th>
                            <th>Doğum Tarihi</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentStudents.map((s) => (
                            <tr key={s.studentid}>
                                <td>{s.studentid}</td>
                                <td>{s.first_name}</td>
                                <td>{s.last_name}</td>
                                <td>{s.class_name}</td>
                                <td>{s.season_year}</td>
                                <td>{s.birth_date}</td>
                                <td>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.studentid)}>
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center">Kayıtlı talebe bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>

                </table>

            )}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center my-3 gap-3">
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
                </div>
            )}

            <div className="d-flex justify-content-end mb-3">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                >
                    Yeni Talebe Ekle
                </button>
            </div>

        </div>
    );
};

export default Settings;
