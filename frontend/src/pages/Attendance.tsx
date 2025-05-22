import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence } from 'framer-motion';
import FilterToolbar from '../components/FilterToolbar';
import Layout from '../components/Layout';
import { classOrder, groupHeaderTitles } from '../constants';
import { authFetch } from '../utils/authFetch';

// ---- Define types, options, helpers ----

const PROGRAM_OPTIONS = [
  'sabah namazi', 'öglen namazi', 'ikindi namazi', 'aksam namazi', 'yatsi namazi', 'hatim',
];

const normalizeClassName = (str: string) => {
  let out = str.trim().toLowerCase().replace(/ /g, '_');
  if (out === 'mezun_tekamulalti') out = 'mezun_tekamul_alti';
  return out;
};

const fetchJson = async (url: string, options = {}) => {
  const res = await authFetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// ---- Page Component ----

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>('');
  const [program, setProgram] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // --- Data load ---

  useEffect(() => {
    const savedDate = localStorage.getItem('attendance-date');
    const savedProgram = localStorage.getItem('attendance-program');
    if (savedDate) setDate(savedDate);
    if (savedProgram) setProgram(savedProgram);
  }, []);

  useEffect(() => {
    fetchJson('http://192.168.50.120:3001/student')
      .then(setStudents)
      .catch(() => toast.error('Talebeler alınamadı'));
  }, []);

  useEffect(() => localStorage.setItem('attendance-date', date), [date]);
  useEffect(() => localStorage.setItem('attendance-program', program), [program]);

  // --- Load full attendance list (only when really needed) ---

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
      const res = await authFetch(`http://192.168.50.120:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
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

  // --- Create new attendance (bulk, triggers full reload) ---
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
      await authFetch('http://192.168.50.120:3001/attendance/create', {
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
      // Determine POST vs PUT as in your API logic
      const checkUrl = `http://192.168.50.120:3001/attendance?studentid=${studentid}&date=${date}&program_name=${program}`;
      const checkRes = await authFetch(checkUrl);
      const record = await checkRes.json();
      const method = checkRes.ok && record ? 'PUT' : 'POST';
      const url = method === 'PUT'
        ? 'http://192.168.50.120:3001/attendance/put'
        : 'http://192.168.50.120:3001/attendance/create';

      const body = {
        studentid,
        date,
        program_name: program,
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
          : [...prev, { studentid, date, program_name: program, attendance_type_name, sebep }]
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



  const handleSendWhatsApp = () => {
    // First, group students by class for yok and izinli separately
    const yoklarByClass: Record<string, string[]> = {};
    const izinlilerByClass: Record<string, string[]> = {};

    students.forEach(student => {
      const record = attendanceData.find(a => a.studentid === student.studentid);
      if (!record) return;
      const normClass = normalizeClassName(student.class_name);
      const label = `${student.first_name} ${student.last_name}`;
      if (record.attendance_type_name?.toLowerCase() === 'yok') {
        if (!yoklarByClass[normClass]) yoklarByClass[normClass] = [];
        yoklarByClass[normClass].push(label);
      }
      if (record.attendance_type_name?.toLowerCase() === 'izinli') {
        if (!izinlilerByClass[normClass]) izinlilerByClass[normClass] = [];
        izinlilerByClass[normClass].push(label);
      }
    });

    // Format message
    let msg = '';

    // "Yoklar" section
    msg += '--Yoklar:\n';
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

    // "İzinliler" section
    msg += '\n--İzinliler:\n';
    let izinliAny = false;
    classOrder.forEach(classKey => {
      if (izinlilerByClass[classKey]?.length) {
        izinliAny = true;
        msg += `\n${groupHeaderTitles[classKey]}:\n`;
        izinlilerByClass[classKey].forEach(name => {
          msg += `• ${name}\n`;
        });
      }
    });
    if (!izinliAny) msg += 'İzinli talebe yok!\n';

    // WhatsApp's send link format
    const url = `https://wa.me/?text=${encodeURIComponent(msg.trim())}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = () => {
    // Construct your formatted message (e.g. absents list)
    // Use your existing WhatsApp formatting logic:
    // (Example: message only for absents)
    const yoklarByClass: Record<string, string[]> = {};
    const izinlilerByClass: Record<string, string[]> = {};

    students.forEach(student => {
      const record = attendanceData.find(a => a.studentid === student.studentid);
      if (!record) return;
      const normClass = normalizeClassName(student.class_name);
      const label = `${student.first_name} ${student.last_name}`;
      if (record.attendance_type_name?.toLowerCase() === 'yok') {
        if (!yoklarByClass[normClass]) yoklarByClass[normClass] = [];
        yoklarByClass[normClass].push(label);
      }
      if (record.attendance_type_name?.toLowerCase() === 'izinli') {
        if (!izinlilerByClass[normClass]) izinlilerByClass[normClass] = [];
        izinlilerByClass[normClass].push(label);
      }
    });

    let msg = '';

    // "Yoklar" section
    msg += '🟥 Yoklar:\n';
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
    if (!yokAny) msg += 'Olmayan Talebe yok!\n';

    // "İzinliler" section
    msg += '\n🟦 İzinliler:\n';
    let izinliAny = false;
    classOrder.forEach(classKey => {
      if (izinlilerByClass[classKey]?.length) {
        izinliAny = true;
        msg += `\n${groupHeaderTitles[classKey]}:\n`;
        izinlilerByClass[classKey].forEach(name => {
          msg += `• ${name}\n`;
        });
      }
    });
    if (!izinliAny) msg += 'İzinli talebe yok!\n';

    // Native sharing (mobile)
    if (navigator.share) {
      navigator.share({
        text: msg.trim(),
        title: "Günlük Yoklama",
      }).catch((err) => {
        // User cancelled or sharing failed
        // Optionally fallback to WhatsApp web share:
        window.open(`https://wa.me/?text=${encodeURIComponent(msg.trim())}`, '_blank');
      });
    } else {
      // Fallback for desktop/unsupported
      window.open(`https://wa.me/?text=${encodeURIComponent(msg.trim())}`, '_blank');
    }
  };




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

        <button
          className="btn btn-success mb-3"
          onClick={handleSendWhatsApp}
        >
          Yok & İzinlileri WhatsApp'ta Paylaş
        </button>
        <button className="btn btn-success mb-3" onClick={handleNativeShare}>
          Yok & İzinlileri Paylaş (WhatsApp / Diğer)
        </button>

        <div className="mb-3">
          <h5>Talebe Sayısı: {filteredStudents.length}</h5>
          {showTable && (
            <AttendanceResponsiveView
              students={filteredStudents}
              attendanceData={attendanceData}
              date={date}
              program={program}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateSebep={handleUpdateSebep} // If your AttendanceTable uses it
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
      </div>
    </Layout>
  );
};

export default Attendance;