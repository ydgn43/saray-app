import { useState, useEffect } from 'react';
import AttendanceResponsiveView from '../components/AttendanceResponsiveView';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';
import FilterToolbar from '../components/FilterToolbar';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { authFetch } from '../utils/authFetch';
import BackToTopButton from '../components/BackToTopButton';
import config from '../config';
import { useAuth } from '../auth/AuthContext';
import { useAttendanceSync } from '../websocket/useAttendanceSync';
import { usePresence } from '../websocket/usePresence';
import { ActiveUsersIndicator } from '../components/ActiveUsersIndicator';

interface Program {
  programid?: number;
  program_name: string;
  display_name?: string | null;
  display_order?: number | null;
}

interface Class {
  class_name: string;
  display_name?: string | null;
  display_order?: number | null;
}

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

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentlyUpdatedStudents, setRecentlyUpdatedStudents] = useState<Set<number>>(new Set());

  // Set today's date as default
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [date, setDate] = useState<string>(getTodayString());
  const [program, setProgram] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);

  // WebSocket real-time attendance sync
  const { isConnected, broadcastUpdate, broadcastCreate, broadcastBulkSave } = useAttendanceSync({
    currentDate: date,
    currentProgram: program, // Use program_name directly
    onAttendanceUpdate: (data) => {
      // Update attendance data when receiving updates from other users
      // Match by composite key: studentid + date + program_name
      setAttendanceData(prev =>
        prev.map(a =>
          a.studentid === data.studentid &&
            a.date === data.date &&
            a.program_name === data.program_name
            ? {
              ...a,
              attendancetypeid: data.attendancetypeid,
              attendance_type_name: getAttendanceTypeName(data.attendancetypeid),
              sebep: data.sebep || ''
            }
            : a
        )
      );
      // Highlight the updated student
      setRecentlyUpdatedStudents(prev => new Set(prev).add(data.studentid));
      setTimeout(() => {
        setRecentlyUpdatedStudents(prev => {
          const next = new Set(prev);
          next.delete(data.studentid);
          return next;
        });
      }, 2000);

      toast.info(`${data.updatedBy} bir yoklama güncelledi`, { autoClose: 2000 });
    },
    onUserJoined: (data) => {
      toast.info(`👤 ${data.username} oturuma katıldı (${data.userCount} kullanıcı)`, { autoClose: 2000 });
    },
    onUserLeft: (data) => {
      toast.info(`👤 ${data.username} oturumdan ayrıldı (${data.userCount} kullanıcı)`, { autoClose: 2000 });
    },
    onBulkSave: (data) => {
      toast.success(`📋 ${data.savedBy} toplu kayıt yaptı (${data.count} kayıt)`, { autoClose: 3000 });
      // Refresh attendance data to show the bulk changes
      if (date && program) {
        loadAttendanceData(true);
      }
    },
  });

  // Presence tracking - show active users viewing this attendance
  const presenceRoomName = date && program ? `attendance:${date}:${program}` : undefined;
  const { activeUsers, userCount } = usePresence({
    roomName: presenceRoomName
  });

  // Helper function to get attendance type name from ID
  const getAttendanceTypeName = (typeid: number): string => {
    const typeMap: Record<number, string> = {
      1: 'var',
      2: 'yok',
      3: 'gec',
      4: 'izinli',
    };
    return typeMap[typeid] || 'var';
  };

  // Fetch available programs from the database
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await authFetch(`${config.API_BASE_URL}/program`);
        const data: Program[] = await response.json();
        // Programs are already sorted by display_order from backend
        setAvailablePrograms(data);
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast.error('Programlar yüklenemedi');
      }
    };

    fetchPrograms();
  }, []);

  // Fetch available classes from the database
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authFetch(`${config.API_BASE_URL}/class`);
        const data: Class[] = await response.json();
        // Classes are already sorted by display_order from backend
        setAvailableClasses(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
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
      // program is already in DB format (e.g., 'sabah_namazi')
      const res = await authFetch(`${config.API_BASE_URL}/attendance/dailyprogram?date=${date}&program_name=${program}`);
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

    // program is already in DB format (e.g., 'sabah_namazi')
    const payload = students.map(s => ({
      studentid: s.studentid,
      date,
      program_name: program,
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

  // --- Delete all attendance for program ---
  const handleDeleteAllAttendance = async () => {
    if (!date || !program) {
      toast.error("Tarih ve program seçiniz.");
      return;
    }

    const confirmed = window.confirm(
      `Bu program için tüm yoklama kayıtlarını silmek istediğinize emin misiniz?\n\n` +
      `Tarih: ${formatDateDisplay(date)}\n` +
      `Program: ${program}\n` +
      `Toplam ${attendanceData.length} kayıt silinecek.\n\n` +
      `Bu işlem geri alınamaz!`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      // program is already in DB format (e.g., 'sabah_namazi')
      const res = await authFetch(
        `${config.API_BASE_URL}/attendance/delete-program?date=${date}&program_name=${program}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      const data = await res.json();
      toast.success(data.message || 'Yoklama kayıtları silindi');

      // Clear the attendance data and show create button
      setAttendanceData([]);
      setShowCreateButton(true);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Yoklama kayıtları silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  // --- Submit all current attendance data to ensure synchronization ---
  const handleSubmitAll = async () => {
    if (!date || !program) {
      toast.error("Tarih ve program seçiniz.");
      return;
    }

    if (attendanceData.length === 0) {
      toast.warning("Kaydedilecek yoklama verisi yok.");
      return;
    }

    const confirmed = window.confirm(
      `Tüm yoklama verilerini kaydetmek istediğinize emin misiniz?\n\n` +
      `Tarih: ${formatDateDisplay(date)}\n` +
      `Program: ${program}\n` +
      `Toplam ${attendanceData.length} kayıt kaydedilecek.\n\n` +
      `Bu işlem mevcut verilerin üzerine yazacak.`
    );

    if (!confirmed) return;

    setSubmitting(true);
    try {
      // Prepare bulk update payload with all current attendance data
      const payload = attendanceData.map(record => ({
        studentid: record.studentid,
        date: date,
        program_name: program,
        attendance_type_name: record.attendance_type_name || 'yok',
        sebep: record.sebep || null
      }));

      // Send all records to backend
      const res = await authFetch(`${config.API_BASE_URL}/attendance/put`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload[0]) // Send one by one in a loop would be better but this is simpler
      });

      // Actually, let's send them all properly
      let successCount = 0;
      let errorCount = 0;

      for (const record of payload) {
        try {
          await authFetch(`${config.API_BASE_URL}/attendance/put`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to save record for student ${record.studentid}:`, error);
        }
      }

      if (errorCount === 0) {
        toast.success(`Tüm yoklama verileri başarıyla kaydedildi! (${successCount} kayıt)`);

        // Broadcast bulk save to other users
        if (program) {
          broadcastBulkSave(date, program, successCount);
        }
      } else if (successCount > 0) {
        toast.warning(`${successCount} kayıt kaydedildi, ${errorCount} kayıt başarısız oldu.`);

        // Still broadcast partial success
        if (program && successCount > 0) {
          broadcastBulkSave(date, program, successCount);
        }
      } else {
        toast.error("Yoklama verileri kaydedilemedi.");
      }

      // Reload data to ensure consistency
      await loadAttendanceData(true);
    } catch (error) {
      console.error('Submit all error:', error);
      toast.error("Yoklama verileri kaydedilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Optimistic row update ---
  const handleUpdateAttendance = async (
    studentid: number,
    attendance_type_name: string,
    sebep: string | null = null
  ) => {
    try {
      // program is already in DB format (e.g., 'sabah_namazi')
      const checkUrl = `${config.API_BASE_URL}/attendance?studentid=${studentid}&date=${date}&program_name=${program}`;
      const checkRes = await authFetch(checkUrl);
      const record = await checkRes.json();
      const method = checkRes.ok && record ? 'PUT' : 'POST';
      const url = method === 'PUT'
        ? `${config.API_BASE_URL}/attendance/put`
        : `${config.API_BASE_URL}/attendance/create`;

      const body = {
        studentid,
        date,
        program_name: program,
        attendance_type_name,
        sebep,
      };

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

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

      // Broadcast WebSocket update to other users
      if (program) {
        const typeMap: Record<string, number> = {
          'var': 1,
          'yok': 2,
          'gec': 3,
          'izinli': 4,
        };
        const attendancetypeid = typeMap[attendance_type_name.toLowerCase()] || 1;

        console.log('🔥 Broadcasting update:', {
          method,
          studentid,
          attendancetypeid,
          date,
          program_name: program,
          sebep,
          isConnected
        });

        if (method === 'POST') {
          broadcastCreate({
            studentid,
            attendancetypeid,
            date,
            program_name: program,
          });
        } else {
          broadcastUpdate(
            studentid,
            attendancetypeid,
            date,
            program,
            sebep || undefined
          );
        }
      } else {
        console.warn('⚠️ Not broadcasting - program is empty');
      }

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
  const filteredStudents = (selectedClasses.length > 0
    ? students.filter(s => selectedClasses.includes(s.class_name))
    : students).sort((a, b) => a.first_name.localeCompare(b.first_name, 'tr'));

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

    // Helper to get display name for class
    const getClassDisplayName = (className: string) => {
      const cls = availableClasses.find(c => normalizeClassName(c.class_name) === className);
      return cls?.display_name || className;
    };

    // Format message
    let msg = '';
    msg += '🟥 Olmayanlar:\n';
    let yokAny = false;
    availableClasses.forEach(cls => {
      const classKey = normalizeClassName(cls.class_name);
      if (yoklarByClass[classKey]?.length) {
        yokAny = true;
        msg += `\n${cls.display_name || cls.class_name}:\n`;
        yoklarByClass[classKey].forEach(name => {
          msg += `• ${name}\n`;
        });
      }
    });
    if (!yokAny) msg += 'Olmayan talebe yok!\n';

    msg += '\n🟧 Geç Kalanlar:\n';
    let gecAny = false;
    availableClasses.forEach(cls => {
      const classKey = normalizeClassName(cls.class_name);
      if (gecByClass[classKey]?.length) {
        gecAny = true;
        msg += `\n${cls.display_name || cls.class_name}:\n`;
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
    availableClasses.forEach(cls => {
      const classKey = normalizeClassName(cls.class_name);
      if (izinlilerByClass[classKey]?.length) {
        izinliAny = true;
        msg += `\n${cls.display_name || cls.class_name}:\n`;
        izinlilerByClass[classKey].forEach(({ name, sebep }) => {
          msg += `• ${name}`;
          if (sebep) msg += ` (${sebep})`;
          msg += '\n';
        });
      }
    });
    if (!izinliAny) msg += 'İzinli talebe yok!\n';

    // Add program and date at the top
    const selectedProgram = availablePrograms.find(p => p.program_name === program);
    const programDisplayName = selectedProgram?.display_name || program;

    let header = '';
    if (date) header += `Tarih: ${date}\n`;
    if (program) header += `Program: ${programDisplayName}\n`;
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
                  <option key={p.program_name} value={p.program_name}>
                    {p.display_name || p.program_name}
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
        <div className="d-flex gap-2 mb-2 flex-wrap">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="btn btn-success shadow-sm btn-sm"
            onClick={handleSubmitAll}
            disabled={submitting}
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '0.85rem',
              background: submitting ? '#6c757d' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: 'white',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Kaydediliyor...
              </>
            ) : (
              <>
                💾 Tümünü Kaydet
              </>
            )}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="btn btn-info shadow-sm btn-sm"
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

          {user?.role === 'admin' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="btn btn-danger shadow-sm btn-sm"
              onClick={handleDeleteAllAttendance}
              disabled={deleting}
              style={{
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '0.85rem',
                background: deleting ? '#6c757d' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                color: 'white',
                opacity: deleting ? 0.6 : 1
              }}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Siliniyor...
                </>
              ) : (
                <>
                  🗑️ Tüm Kayıtları Sil
                </>
              )}
            </motion.button>
          )}
        </div>
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
            className="mb-2 d-flex gap-2 align-items-center"
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

            {/* WebSocket Connection Status */}
            <div
              className={`d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill shadow-sm ${isConnected ? 'bg-success' : 'bg-secondary'}`}
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '0.75rem'
              }}
              title={isConnected ? 'WebSocket bağlı - Canlı güncellemeler aktif' : 'WebSocket bağlantısı kesildi'}
            >
              <span style={{ fontSize: '0.9rem' }}>{isConnected ? '🔌' : '⚠️'}</span>
              <span>{isConnected ? 'Canlı' : 'Çevrimdışı'}</span>
            </div>

            {/* Active Users Indicator */}
            {isConnected && userCount > 0 && (
              <ActiveUsersIndicator activeUsers={activeUsers} userCount={userCount} />
            )}
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
            availableClasses={availableClasses}
            recentlyUpdatedStudents={recentlyUpdatedStudents}
            isWebSocketConnected={isConnected}
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


