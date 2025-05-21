// pages/Attendance.tsx
import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence } from 'framer-motion';
import FilterToolbar from '../components/FilterToolbar';
import Layout from '../components/Layout';
import { LayoutTextSidebar } from 'react-bootstrap-icons';

// Define types

const PROGRAM_OPTIONS = [
  'sabah namazi', 'ögle namazi', 'ikindi namazi', 'aksam namazi', 'yatsi namazi', 'hatim',
];

const fetchJson = async (url: string, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>('');
  const [program, setProgram] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    const savedDate = localStorage.getItem('attendance-date');
    const savedProgram = localStorage.getItem('attendance-program');
    if (savedDate) setDate(savedDate);
    if (savedProgram) setProgram(savedProgram);
  }, []);

  useEffect(() => {
    fetchJson('http://192.168.50.120:3001/student')
      .then(setStudents)
      .catch(() => toast.error('Öğrenciler alınamadı'));
  }, []);

  useEffect(() => localStorage.setItem('attendance-date', date), [date]);
  useEffect(() => localStorage.setItem('attendance-program', program), [program]);

  const loadAttendanceData = async (preserveScroll = false) => {
    const scrollY = window.scrollY;

    if (!date || !program) {
      toast.warning("Tarih ve program seçiniz.");
      return;
    }

    setLoading(true);
    setShowCreateButton(false);
    setShowTable(false);

    try {
      const res = await fetch(`http://192.168.50.120:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setAttendanceData([]);
        toast.error("Beklenmeyen yanıt: yoklama verisi alınamadı.");
        return;
      }

      setAttendanceData(data);
      setShowCreateButton(data.length === 0);
      setShowTable(data.length > 0);

      if (preserveScroll) {
        setTimeout(() => {
          window.scrollTo({ top: scrollY, behavior: 'auto' });
        }, 0);
      }
    } catch {
      toast.error("Yoklama verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAttendance = async () => {
    if (!date || !program) {
      toast.error("Tarih ve program seçiniz.");
      return;
    }

    const payload = students.map(s => ({
      studentid: s.studentid,
      date,
      program_name: program,
      attendance_type_name: 'yok',
    }));

    try {
      await fetch('http://192.168.50.120:3001/attendance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success("Yeni yoklama oluşturuldu");
      setShowCreateButton(false);
      await loadAttendanceData();
    } catch {
      toast.error("Yoklama oluşturulamadı");
    }
  };

  const filteredStudents = selectedClasses.length > 0
    ? students.filter(s => selectedClasses.includes(s.class_name))
    : students;

  return (
    <Layout>
      <div className="container">

        <ToastContainer />
        <h1 className="mb-4">Günlük Yoklama</h1>

        <div className="card p-4 shadow-sm mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Tarih</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Program</label>
              <select
                className="form-select"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="">Program Seçin</option>
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={() => loadAttendanceData()}
                disabled={!date || !program || loading}
              >
                {loading ? 'Yükleniyor...' : 'Göster'}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCreateButton && (
            <div className="mb-3">
              <button className="btn btn-success" onClick={handleCreateAttendance}>
                Yeni Yoklama Oluştur
              </button>
            </div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        )}

        {showTable && (
          <AttendanceResponsiveView
            students={filteredStudents}
            attendanceData={attendanceData}
            date={date}
            program={program}
            onChange={() => loadAttendanceData(true)}
            showCreateButton={showCreateButton}
            onCreate={handleCreateAttendance}
          />
        )}

        {!loading && !showTable && !showCreateButton && (
          <div className="alert alert-info text-center">Veri bulunamadı.</div>
        )}

        <FilterToolbar
          onFilterChange={(className) =>
            setSelectedClasses(prev =>
              prev.includes(className)
                ? prev.filter(c => c !== className)
                : [...prev, className]
            )
          }
          selectedFilters={selectedClasses}
          classNames={[...new Set(students.map(s => s.class_name))]}
        />
      </div>
    </Layout>
  );
};

export default Attendance;