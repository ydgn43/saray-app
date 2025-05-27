import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';
import FilterToolbar from '../components/FilterToolbar';
import Layout from '../components/Layout';
import { classOrder, groupHeaderTitles } from '../constants';
import { authFetch } from '../utils/authFetch';
import BackToTopButton from '../components/BackToTopButton';

const PROGRAM_OPTIONS = [
  'Sabah Namazı', 'Öğle Namazı', 'İkindi Namazı', 'Akşam Namazı', 'Yatsı Namazı', 'Hatim'
];

// Map user-friendly names to DB values
const PROGRAM_NAME_MAP: Record<string, string> = {
  "Sabah Namazı": "sabah_namazi",
  "Öğle Namazı": "oglen_namazi",
  "İkindi Namazı": "ikindi_namazi",
  "Akşam Namazı": "aksam_namazi",
  "Yatsı Namazı": "yatsi_namazi",
  "Hatim": "hatim"
};

const normalizeClassName = (str: string) => {
  let out = str.trim().toLowerCase().replace(/ /g, '_');
  if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
  return out;
};

// Defensive normalization for Turkish chars
function normalizeProgramName(str: string) {
  return str
    .toLowerCase()
    .replace(/ /g, ' ')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c');
}

const fetchJson = async (url: string, options = {}) => {
  const res = await authFetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>('');
  const [program, setProgram] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    const savedDate = localStorage.getItem('attendance-date');
    const savedProgram = localStorage.getItem('attendance-program');
    if (savedDate) setDate(savedDate);
    if (savedProgram) {
      setProgram(savedProgram);
    }
  }, []);

  useEffect(() => {
    fetchJson('http://192.168.50.76:3001/student')
      .then(setStudents)
      .catch(() => toast.error('Talebeler alınamadı'));
  }, []);

  useEffect(() => localStorage.setItem('attendance-date', date), [date]);
  useEffect(() => {
    if (program) {
      localStorage.setItem('attendance-program', program);
    }
  }, [program]);

  // --- Load attendance data (with overlay spinner) ---
  const loadAttendanceData = async (preserveScroll = false) => {
    const scrollY = window.scrollY;
    if (!date || !program) {
      toast.warning("Tarih ve program seçiniz.");
      return;
    }
    setLoading(true);
    setShowCreateButton(false);

    try {
      const apiProgramName = normalizeProgramName(PROGRAM_NAME_MAP[program] || program);
      const res = await authFetch(`http://192.168.50.76:3001/attendance/dailyprogram?date=${date}&program_name=${apiProgramName}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setAttendanceData([]);
        toast.error("Beklenmeyen yanıt: yoklama verisi alınamadı.");
        setLoading(false);
        return;
      }
      setAttendanceData(data);
      setShowCreateButton(data.length === 0);

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

  // --- Create new attendance (bulk, triggers full reload) ---
  const handleCreateAttendance = async () => {
    if (!date || !program) {
      toast.error("Tarih ve program seçiniz.");
      return;
    }

    const apiProgramName = normalizeProgramName(PROGRAM_NAME_MAP[program] || program);
    const payload = students.map(s => ({
      studentid: s.studentid,
      date,
      program_name: apiProgramName,
      attendance_type_name: 'yok',
    }));

    try {
      await authFetch('http://192.168.50.76:3001/attendance/create', {
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

  // --- Optimistic row update ---
  const handleUpdateAttendance = async (
    studentid: number,
    attendance_type_name: string,
    sebep: string | null = null
  ) => {
    try {
      const apiProgramName = normalizeProgramName(PROGRAM_NAME_MAP[program] || program);
      // Determine POST vs PUT as in your API logic
      const checkUrl = `http://192.168.50.76:3001/attendance?studentid=${studentid}&date=${date}&program_name=${apiProgramName}`;
      const checkRes = await authFetch(checkUrl);
      const record = await checkRes.json();
      const method = checkRes.ok && record ? 'PUT' : 'POST';
      const url = method === 'PUT'
        ? 'http://192.168.50.76:3001/attendance/put'
        : 'http://192.168.50.76:3001/attendance/create';

      const body = {
        studentid,
        date,
        program_name: apiProgramName,
        attendance_type_name,
        sebep,
      };

      await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Optimistic local update
      setAttendanceData(prev =>
        prev.some(a => a.studentid === studentid)
          ? prev.map(a =>
            a.studentid === studentid
              ? { ...a, attendance_type_name, sebep }
              : a
          )
          : [...prev, { studentid, date, program_name: apiProgramName, attendance_type_name, sebep }]
      );

    } catch (err) {
      toast.error('Yoklama güncellenemedi');
    }
  };

  // --- Optimistic sebep update ---
  const handleUpdateSebep = async (
    studentid: number,
    currentType: string,
    sebep: string
  ) => {
    try {
      await handleUpdateAttendance(studentid, currentType, sebep);
    } catch {
      toast.error('Sebep güncellenemedi');
    }
  };

  // --- Filtered students by selected classes ---
  const filteredStudents = selectedClasses.length > 0
    ? students.filter(s => selectedClasses.includes(s.class_name))
    : students;

  const handleShareAbsentees = () => {
    // Grouping by type and class
    const yoklarByClass: Record<string, string[]> = {};
    const gecByClass: Record<string, { name: string; sebep?: string }[]> = {};
    const izinlilerByClass: Record<string, { name: string; sebep?: string }[]> = {};

    students.forEach(student => {
      const record = attendanceData.find(a => a.studentid === student.studentid);
      if (!record) return;
      const normClass = normalizeClassName(student.class_name);
      const label = `${student.first_name} ${student.last_name}`;
      if (record.attendance_type_name?.toLowerCase() === 'yok') {
        if (!yoklarByClass[normClass]) yoklarByClass[normClass] = [];
        yoklarByClass[normClass].push(label);
      }
      if (record.attendance_type_name?.toLowerCase() === 'gec') {
        if (!gecByClass[normClass]) gecByClass[normClass] = [];
        gecByClass[normClass].push({ name: label, sebep: record.sebep });
      }
      if (record.attendance_type_name?.toLowerCase() === 'izinli') {
        if (!izinlilerByClass[normClass]) izinlilerByClass[normClass] = [];
        izinlilerByClass[normClass].push({ name: label, sebep: record.sebep });
      }
    });

    // Format message
    let msg = '';
    msg += '🟥 Olmayanlar:\n';
    let yokAny = false;
    classOrder.forEach(classKey => {
      if (yoklarByClass[classKey]?.length) {
        yokAny = true;
        msg += `\n${groupHeaderTitles[classKey]}:\n`;
        yoklarByClass[classKey].forEach(name => {
          msg += `• ${name}\n`;
        });
      }
    });
    if (!yokAny) msg += 'Olmayan talebe yok!\n';

    msg += '\n🟧 Geç Kalanlar:\n';
    let gecAny = false;
    classOrder.forEach(classKey => {
      if (gecByClass[classKey]?.length) {
        gecAny = true;
        msg += `\n${groupHeaderTitles[classKey]}:\n`;
        gecByClass[classKey].forEach(({ name, sebep }) => {
          msg += `• ${name}`;
          if (sebep) msg += ` (${sebep})`;
          msg += '\n';
        });
      }
    });
    if (!gecAny) msg += 'Geç kalan yok!\n';

    msg += '\n🟦 İzinliler:\n';
    let izinliAny = false;
    classOrder.forEach(classKey => {
      if (izinlilerByClass[classKey]?.length) {
        izinliAny = true;
        msg += `\n${groupHeaderTitles[classKey]}:\n`;
        izinlilerByClass[classKey].forEach(({ name, sebep }) => {
          msg += `• ${name}`;
          if (sebep) msg += ` (${sebep})`;
          msg += '\n';
        });
      }
    });
    if (!izinliAny) msg += 'İzinli talebe yok!\n';

    // Add program and date at the top (optional, but nice)
    let header = '';
    if (date) header += `📅 Tarih: ${date}\n`;
    if (program) header += `🕌 Program: ${normalizeProgramName(PROGRAM_NAME_MAP[program] || program)}\n`;
    header += '\n';

    const fullMsg = header + msg.trim();

    // Native share if possible, fallback to WhatsApp
    if (navigator.share) {
      navigator.share({
        title: "Günlük Yoklama",
        text: fullMsg,
      }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
    }
  };


  return (

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

      <button className="btn btn-success mb-3" onClick={handleShareAbsentees}>
        Yoklama Bilgisini Paylaş
      </button>

      <div className="mb-3" style={{ position: 'relative', minHeight: 240 }}>
        {/* Overlay Spinner with animation */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 5,
                borderRadius: '8px'
              }}
            >
              <div className="spinner-border text-primary" role="status" style={{ width: 48, height: 48 }}>
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h5>Talebe Sayısı: {filteredStudents.length}</h5>
        {attendanceData.length > 0 ? (
          <AttendanceResponsiveView
            students={filteredStudents}
            attendanceData={attendanceData}
            date={date}
            program={program}
            onUpdateAttendance={handleUpdateAttendance}
            showCreateButton={showCreateButton}
            onCreate={handleCreateAttendance}
            fetchAttendanceData={loadAttendanceData}
          />
        ) : (
          !loading && !showCreateButton && (
            <div className="alert alert-info text-center mt-3">Veri bulunamadı.</div>
          )
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
        <BackToTopButton />
      </div>
    </div>

  );
};

export default Attendance;
