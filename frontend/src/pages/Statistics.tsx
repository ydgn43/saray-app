import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { unparse } from 'papaparse';
import { authFetch } from '../utils/authFetch';


interface StatisticEntry {
    studentid: number;
    name: string;
    class_name: string;
    total: number;
    percentages: {
        var?: number;
        gec?: number;
        yok?: number;
        izinli?: number;
    };
}

const Statistics = () => {
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statistics, setStatistics] = useState<StatisticEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedStartDate = localStorage.getItem('statistics-startDate');
        const savedEndDate = localStorage.getItem('statistics-endDate');
        if (savedStartDate) setStartDate(savedStartDate);
        if (savedEndDate) setEndDate(savedEndDate);
    }, []);

    useEffect(() => {
        if (startDate) localStorage.setItem('statistics-startDate', startDate);
    }, [startDate]);

    useEffect(() => {
        if (endDate) localStorage.setItem('statistics-endDate', endDate);
    }, [endDate]);

    const fetchStatistics = async () => {
        if (!startDate || !endDate) {
            toast.error('Lütfen tarih aralığı seçin.');
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(
                `http://localhost:3001/attendance/statistics?startDate=${startDate}&endDate=${endDate}`
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStatistics(data);
        } catch {
            toast.error('İstatistik verileri alınamadı.');
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = statistics.filter((entry) => {
        const varValue = entry.percentages.var || 0;
        const matchesColor =
            selectedColor === '' ||
            (selectedColor === 'green' && varValue >= 80) ||
            (selectedColor === 'yellow' && varValue >= 60 && varValue < 80) ||
            (selectedColor === 'red' && varValue < 60);

        const matchesClass = selectedClass === '' || entry.class_name === selectedClass;

        const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());


        return matchesColor && matchesClass && matchesSearch;
    });

    const handleExportToCSV = async () => {
        if (filteredStats.length === 0) {
            toast.info('Dışa aktarılacak veri yok.');
            return;
        }
        try {
            const dataToExport = filteredStats.map((s) => ({
                İsim: s.name,
                Sınıf: s.class_name,
                'Var (%)': s.percentages.var ?? 0,
                'Geç (%)': s.percentages.gec ?? 0,
                'Yok (%)': s.percentages.yok ?? 0,
                'İzinli (%)': s.percentages.izinli ?? 0,
            }));
            const csv = unparse(dataToExport);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `istatistikler_${startDate}_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('CSV dışa aktarma sırasında bir hata oluştu.');
        }
    };

    const handleExportToExcel = () => {
      if (filteredStats.length === 0) {
          toast.info('Dışa aktarılacak veri yok.');
          return;
      }
  
      // Sort by class then name
      const sorted = [...filteredStats].sort((a, b) =>
          a.class_name.localeCompare(b.class_name) || a.name.localeCompare(b.name)
      );
  
      const worksheetData = [
          ['Ad Soyad', 'Sınıf', 'VAR', 'GEÇ', 'YOK', 'İZİNLİ']
      ];
  
      sorted.forEach(s => {
          worksheetData.push([
              s.name,
              s.class_name,
              (s.percentages.var ?? 0) + '%',
              (s.percentages.gec ?? 0) + '%',
              (s.percentages.yok ?? 0) + '%',
              (s.percentages.izinli ?? 0) + '%',
          ]);
      });
  
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'İstatistik');
  
      // Style headers bold
      const headerRef = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
      headerRef.forEach(cell => {
          if (!ws[cell]) return;
          ws[cell].s = { font: { bold: true } };
      });
  
      XLSX.writeFile(wb, `istatistikler_${startDate}_${endDate}.xlsx`);
  };
  

    const handleExportToPDF = () => {
        if (filteredStats.length === 0) {
            toast.info('Dışa aktarılacak veri yok.');
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('Yoklama İstatistikleri', 14, 16);

        // Table columns and rows
        const columns = [
            { header: '#', dataKey: 'index' },
            { header: 'İsim', dataKey: 'name' },
            { header: 'Sınıf', dataKey: 'class_name' },
            { header: 'Var (%)', dataKey: 'var' },
            { header: 'Geç (%)', dataKey: 'gec' },
            { header: 'Yok (%)', dataKey: 'yok' },
            { header: 'İzinli (%)', dataKey: 'izinli' },
        ];
        const rows = filteredStats.map((s, i) => ({
            index: i + 1,
            name: s.name,
            class_name: s.class_name,
            var: s.percentages.var ?? 0,
            gec: s.percentages.gec ?? 0,
            yok: s.percentages.yok ?? 0,
            izinli: s.percentages.izinli ?? 0,
        }));

        // Use autoTable for better Excel-like look
        autoTable(doc, {
            columns,
            body: rows,
            startY: 22,
            styles: { font: 'helvetica', fontSize: 10, cellPadding: 2 },
            headStyles: { fillColor: [13, 110, 253] }, // Bootstrap primary
            alternateRowStyles: { fillColor: [240, 248, 255] },
            margin: { left: 8, right: 8 },
        });

        doc.save(`istatistikler_${startDate}_${endDate}.pdf`);
    };

    return (
        <>
            <ToastContainer />
            <h1 className="mb-4">Yoklama İstatistikleri</h1>

            <div className="row mb-3">
                <div className="col-md-4">
                    <label>Başlangıç Tarihi</label>
                    <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <label>Bitiş Tarihi</label>
                    <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                    <button
                        className="btn btn-primary w-100"
                        onClick={fetchStatistics}
                        style={{ transition: 'all 0.3s ease-in-out' }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Verileri Getir
                    </button>
                </div>
            </div>

            {statistics.length > 0 && (
                <>
                    <h5 className="mb-2">
                        Toplam Öğrenci: <span className="badge bg-info">{filteredStats.length}</span>
                    </h5>
                    <div className="mb-3">
                        <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                            {[
                                { label: 'İyi', color: 'green', value: 'green', textColor: 'white' },
                                { label: 'Orta', color: 'yellow', value: 'yellow', textColor: 'black' },
                                { label: 'Kötü', color: 'red', value: 'red', textColor: 'white' },
                            ].map(({ label, color, value, textColor }) => (
                                <span
                                    key={value}
                                    className="badge"
                                    style={{
                                        backgroundColor: color,
                                        color: textColor,
                                        opacity: selectedColor === value ? 1 : 0.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        transform: selectedColor === value ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                    onClick={() => setSelectedColor(value)}
                                    onMouseEnter={(e) => {
                                        if (selectedColor !== value) {
                                            (e.currentTarget as HTMLElement).style.opacity = '0.8';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedColor !== value) {
                                            (e.currentTarget as HTMLElement).style.opacity = '0.4';
                                        }
                                    }}
                                >
                                    {label}
                                </span>
                            ))}

                            <span
                                className="badge bg-secondary text-white"
                                role="button"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedColor('')}
                            >
                                Temizle
                            </span>
                            <select
                                className="form-select form-select-sm w-auto"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Tüm Sınıflar</option>
                                <option value="kuranikerim">Kuran-ı Kerim</option>
                                <option value="hazirlik">Hazırlık</option>
                                <option value="ibtidai">İbtidai</option>
                                <option value="ihzari">İhzari</option>
                                <option value="tekamul_alti">Tekamul Altı</option>
                                <option value="mevzun_tekamul_alti">Mezun Tekamul Altı</option>
                            </select>

                            <input
                                className="form-control form-control-sm w-auto"
                                type="text"
                                placeholder="İsim ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span
                                className="badge bg-secondary text-white"
                                role="button"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSearchTerm('')}
                            >
                                Temizle İsim
                            </span>
                            <div className="btn-group">
                                <button
                                    className="btn btn-outline-success btn-sm dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    type="button"
                                >
                                    Farklı Kaydet
                                </button>
                                <ul className="dropdown-menu">
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToCSV}>CSV olarak indir</button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToExcel}>Excel olarak indir</button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportToPDF}>PDF olarak indir</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </>
            )}


            {loading ? (
                <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            ) : (
                filteredStats.length > 0 && (
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped align-middle text-center">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Talebe</th>
                                    <th>Sınıf</th>
                                    <th>Var (%)</th>
                                    <th>Geç (%)</th>
                                    <th>Yok (%)</th>
                                    <th>İzinli (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStats.map((s, index) => {
                                    const varVal = s.percentages.var ?? 0;
                                    let rowClass = '';
                                    if (varVal >= 80) rowClass = 'table-success';
                                    else if (varVal >= 60) rowClass = 'table-warning';
                                    else rowClass = 'table-danger';

                                    return (
                                        <tr key={s.studentid} className={rowClass}>
                                            <td>{index + 1}</td>
                                            <td className="text-start">{s.name}</td>
                                            <td>{s.class_name}</td>
                                            <td>{varVal}%</td>
                                            <td>{s.percentages.gec ?? 0}%</td>
                                            <td>{s.percentages.yok ?? 0}%</td>
                                            <td>{s.percentages.izinli ?? 0}%</td>
                                        </tr>
                                    );
                                })}

                            </tbody>
                        </table>
                    </div>
                )
            )}
        </>
    );
};

export default Statistics;
