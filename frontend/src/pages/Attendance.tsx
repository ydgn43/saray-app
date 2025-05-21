// pages/Attendance.tsx
import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';

type Student = {
  studentid: number;
  first_name: string;
  last_name: string;
  class_name: string;
};

type Attendance = {
  studentid: number;
  date: string;
  program_name: string;
  attendance_type_name: string;
  sebep?: string;
};

const PROGRAM_OPTIONS = [
  'sabah namazi', 'ögle namazi', 'ikindi namazi', 'aksam namazi', 'yatsi namazi', 'hatim',
];

const fetchJson = async (url: string, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>('');
  const [program, setProgram] = useState<string>('');

  useEffect(() => {
    const savedDate = localStorage.getItem('attendance-date');
    const savedProgram = localStorage.getItem('attendance-program');
    if (savedDate) setDate(savedDate);
    if (savedProgram) setProgram(savedProgram);
  }, []);

  useEffect(() => {
    fetchJson('http://localhost:3001/student')
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
      const res = await fetch(`http://localhost:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
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
      await fetch('http://localhost:3001/attendance/create', {
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

  return (
    <div className="container mt-4">
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
        <>
          <AttendanceResponsiveView
            students={students}
            attendanceData={attendanceData}
            date={date}
            program={program}
            onChange={() => loadAttendanceData(true)} // with scroll preservation
            showCreateButton={showCreateButton}
            onCreate={handleCreateAttendance}
          />

          <div className="text-end mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => loadAttendanceData(true)}
            >
              Yenile
            </button>
          </div>
        </>
      )}

      {!loading && !showTable && !showCreateButton && (
        <div className="alert alert-info text-center">Veri bulunamadı.</div>
      )}
    </div>
  );
};

export default Attendance;
