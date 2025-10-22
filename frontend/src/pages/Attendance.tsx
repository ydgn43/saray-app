import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';
import FilterToolbar from '../components/FilterToolbar';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { classOrder, groupHeaderTitles } from '../constants';
import { authFetch } from '../utils/authFetch';
import BackToTopButton from '../components/BackToTopButton';
import config from '../config';

// These will be loaded from the database
const PROGRAM_OPTIONS: string[] = [];

// Map user-friendly names to DB values (if needed for backwards compatibility)
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

  // Set today's date as default
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [date, setDate] = useState<string>(getTodayString());
  const [program, setProgram] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  // Fetch available programs from the database
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await authFetch(`${config.API_BASE_URL}/program`);
        const data = await response.json();
        const programNames = data.map((p: any) => p.program_name);
        setAvailablePrograms(programNames);
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast.error('Programlar yüklenemedi');
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    const savedDate = localStorage.getItem('attendance-date');
    const savedProgram = localStorage.getItem('attendance-program');
    // Only use saved date if it exists, otherwise keep today's date
    if (savedDate) setDate(savedDate);
    if (savedProgram) {
      setProgram(savedProgram);
    }
  }, []);

  useEffect(() => {
    fetchJson(`${config.API_BASE_URL}/student`)
      .then(setStudents)
      .catch(() => toast.error('Talebeler alınamadı'));
  }, []);

  useEffect(() => localStorage.setItem('attendance-date', date), [date]);
  useEffect(() => {
    if (program) {
      localStorage.setItem('attendance-program', program);
    }
  }, [program]);

  // Date navigation helpers
  const changeDate = (days: number) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  const goToYesterday = () => changeDate(-1);
  const goToToday = () => setDate(getTodayString());
  const goToTomorrow = () => changeDate(1);

  // Format date for display (Turkish format)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); // Prevent timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(d);
    selected.setHours(0, 0, 0, 0);

    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const dayName = dayNames[d.getDay()];
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return `Bugün, ${day} ${month} ${year}`;
    if (diffDays === -1) return `Dün, ${day} ${month} ${year}`;
    if (diffDays === 1) return `Yarın, ${day} ${month} ${year}`;

    return `${dayName}, ${day} ${month} ${year}`;
  };

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
      const res = await authFetch(`${config.API_BASE_URL}
/attendance/dailyprogram?date=${date}&program_name=${apiProgramName}`);
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
      await authFetch(`${config.API_BASE_URL}/attendance/create`, {
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
      const checkUrl = `${config.API_BASE_URL}
/attendance?studentid=${studentid}&date=${date}&program_name=${apiProgramName}`;
      const checkRes = await authFetch(checkUrl);
      const record = await checkRes.json();
      const method = checkRes.ok && record ? 'PUT' : 'POST';
      const url = method === 'PUT'
        ? `${config.API_BASE_URL}/attendance/put`
        : `${config.API_BASE_URL}/attendance/create`;

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
    if (date) header += `Tarih: ${date}\n`;
    if (program) header += `Program: ${normalizeProgramName(PROGRAM_NAME_MAP[program] || program)}\n`;
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

    <div className="container" style={{ padding: '0 12px' }}>
      <ToastContainer />

      <PageHeader
        title="Günlük Yoklama"
        subtitle="Talebe yoklamalarını takip edin ve yönetin"
      />

      {/* Elegant Date & Program Selector Card */}
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
          {/* Date Selector Section */}
          <div className="mb-2">
            <label className="form-label fw-bold mb-2 d-none d-md-block" style={{ fontSize: '0.85rem' }}>
              Tarih
            </label>

            {/* Date Display with Quick Navigation */}
            <div className="d-flex align-items-center gap-1 gap-md-2 mb-2">
              <button
                onClick={goToYesterday}
                className="btn btn-light btn-sm d-flex align-items-center justify-content-center"
                style={{
                  borderRadius: '8px',
                  padding: '6px',
                  minWidth: '36px',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s'
                }}
                title="Dün"
              >
                ←
              </button>

              <div className="flex-grow-1 text-center">
                <div
                  className="bg-white rounded-2 py-1 px-2 shadow-sm"
                  style={{
                    fontSize: 'clamp(0.75rem, 3vw, 0.95rem)',
                    fontWeight: '600',
                    color: '#1e40af'
                  }}
                >
                  {formatDateDisplay(date)}
                </div>
              </div>

              <button
                onClick={goToTomorrow}
                className="btn btn-light btn-sm d-flex align-items-center justify-content-center"
                style={{
                  borderRadius: '8px',
                  padding: '6px',
                  minWidth: '36px',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s'
                }}
                title="Yarın"
              >
                →
              </button>
            </div>

            {/* Quick Date Buttons */}
            <div className="d-flex gap-1 gap-md-2 justify-content-center mb-2">
              <button
                onClick={goToToday}
                className="btn btn-light btn-sm"
                style={{
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  background: date === getTodayString() ? '#fff' : 'rgba(255,255,255,0.9)',
                  border: date === getTodayString() ? '2px solid #3b82f6' : 'none'
                }}
              >
                Bugün
              </button>

              {/* Calendar Picker Toggle */}
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="form-control btn-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Program Selector */}
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-8">
              <label className="form-label fw-bold mb-1 d-none d-md-block" style={{ fontSize: '0.85rem' }}>Program</label>
              <select
                className="form-select form-select-sm"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <option value="">Program Seçin</option>
                {availablePrograms.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <button
                className="btn btn-light w-100 btn-sm"
                onClick={() => loadAttendanceData()}
                disabled={!date || !program || loading}
                style={{
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  background: (!date || !program || loading) ? '#e0e0e0' : '#fff'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    Göster
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreateButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-2"
          >
            <button
              className="btn btn-success shadow-sm btn-sm"
              onClick={handleCreateAttendance}
              style={{
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                border: 'none'
              }}
            >
              Yeni Yoklama Oluştur
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {attendanceData.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="btn btn-info mb-2 shadow-sm btn-sm"
          onClick={handleShareAbsentees}
          style={{
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: '600',
            fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            border: 'none',
            color: 'white'
          }}
        >
          Paylaş
        </motion.button>
      )}

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

        {/* Student Count Badge */}
        {filteredStudents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2"
          >
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill shadow-sm bg-danger"
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '0.8rem'
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>{filteredStudents.length}</span>
            </div>
          </motion.div>
        )}

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="alert alert-info text-center mt-2 shadow-sm"
              style={{
                borderRadius: '10px',
                border: 'none',
                fontWeight: '500',
                fontSize: '0.85rem',
                padding: '12px'
              }}
            >
              Veri bulunamadı
            </motion.div>
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


