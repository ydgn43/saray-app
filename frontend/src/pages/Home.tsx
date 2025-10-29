import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import DashboardStats from '../components/DashboardStats';
import { useAuth } from '../auth/AuthContext';

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

const PROGRAM_ORDER = [
  'sabah_namazi',
  'oglen_namazi',
  'ikindi_namazi',
  'aksam_namazi',
  'yatsi_namazi',
  'hatim'
];

const PROGRAM_TURKISH_MAP: Record<string, string> = {
  "sabah_namazi": "Sabah Namazı",
  "oglen_namazi": "Öğle Namazı",
  "ikindi_namazi": "İkindi Namazı",
  "aksam_namazi": "Akşam Namazı",
  "yatsi_namazi": "Yatsı Namazı",
  "hatim": "Hatim"
};

const CLASS_NAME_TURKISH_MAP: Record<string, string> = {
  "kuranikerim": "Kur'an-ı Kerim",
  "hazirlik": "Hazırlık",
  "ibtidai": "İbtidai",
  "ihzari": "İhzari",
  "mezun_tekamul_alti": "Mezun Tekamul Altı",
  "tekamul_alti": "Tekamul Altı"
};

function getTurkishClassName(className: string) {
  return CLASS_NAME_TURKISH_MAP[className] || className;
}

function normalizeProgramName(name: string) {
  return name.trim().toLowerCase().replace(/ /g, '_');
}

const Home = () => {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [monthlyTop, setMonthlyTop] = useState<any[]>([]);
  const [myStatistics, setMyStatistics] = useState<StatisticEntry | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isTalebe = user?.role === 'talebe';
  const userStudentId = user?.studentid;

  console.log('🏠 Home component loaded:', { isTalebe, userStudentId, user });

  // Fetch data for talebe users
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { isTalebe, userStudentId });
    if (isTalebe && userStudentId) {
      fetchTalebeStatistics();
    }
  }, [isTalebe, userStudentId]);

  const fetchTalebeStatistics = async () => {
    if (!userStudentId) return;

    setLoading(true);
    try {
      // Calculate current month range
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);

      console.log('🔍 Fetching statistics for:', { userStudentId, startDate, endDate });

      // Fetch statistics
      const statsRes = await authFetch(
        `${config.API_BASE_URL}/attendance/statistics?startDate=${startDate}&endDate=${endDate}`
      );
      if (statsRes.ok) {
        const data = await statsRes.json();
        console.log('📊 Statistics data received:', data);
        const myStats = data.find((s: StatisticEntry) => s.studentid === userStudentId);
        console.log('👤 My statistics:', myStats);
        setMyStatistics(myStats || null);
      }

      // Fetch attendance records
      const recordsRes = await authFetch(
        `${config.API_BASE_URL}/attendance/all?startDate=${startDate}&endDate=${endDate}`
      );
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        console.log('📝 Attendance records:', data.length, 'total records');
        const myRecords = data.filter((r: any) => r.studentid === userStudentId);
        console.log('👤 My attendance records:', myRecords.length, 'records');
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('❌ Error fetching talebe statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get all programs that have at least one record in the date range
  const getProgramsWithRecords = (): Set<string> => {
    const programsSet = new Set<string>();
    attendanceRecords.forEach(rec => {
      programsSet.add(normalizeProgramName(rec.program_name));
    });
    return programsSet;
  };

  function computeProgramPercentages(
    stat: StatisticEntry,
    attendanceRecords: any[]
  ): Record<string, { var: number; izinli: number; hasRecords: boolean }> {
    if (!attendanceRecords.length) {
      return {};
    }

    const studentRecords = attendanceRecords.filter(
      (rec) => rec.studentid === stat.studentid
    );

    const programsWithRecords = getProgramsWithRecords();
    const programMap: Record<string, { var: number; izinli: number; total: number }> = {};

    studentRecords.forEach((rec) => {
      const prog = normalizeProgramName(rec.program_name);
      if (!programMap[prog]) programMap[prog] = { var: 0, izinli: 0, total: 0 };
      if (rec.attendance_type_name === 'var') programMap[prog].var += 1;
      if (rec.attendance_type_name === 'izinli') programMap[prog].izinli += 1;
      programMap[prog].total += 1;
    });

    const result: Record<string, { var: number; izinli: number; hasRecords: boolean }> = {};

    // For programs that have records in the system but student has no records = 100% attendance
    programsWithRecords.forEach(prog => {
      if (programMap[prog]) {
        const { var: v, izinli: i, total } = programMap[prog];
        result[prog] = {
          var: total ? Math.round((v / total) * 100) : 0,
          izinli: total ? Math.round((i / total) * 100) : 0,
          hasRecords: true
        };
      } else {
        // Program has records in system but not for this student = 100% attendance
        result[prog] = {
          var: 100,
          izinli: 0,
          hasRecords: false
        };
      }
    });

    return result;
  }

  const getProgramSums = (stat: StatisticEntry) => {
    const programPercentages = computeProgramPercentages(stat, attendanceRecords);
    const programsWithAnyRecords = getProgramsWithRecords();

    // Only calculate for programs that have records in the system
    const programSums = Array.from(programsWithAnyRecords).map((program) => {
      const prog = programPercentages[program];
      if (!prog) return 100; // Program exists but student has no records = 100%
      return prog.var + prog.izinli;
    });

    // Genel: average only of programs that actually have records in the date range
    const valid = programSums.filter(x => typeof x === 'number');
    const genel = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;

    return { programSums, genel, programPercentages };
  };

  useEffect(() => {
    // Skip these fetches for talebe users
    if (isTalebe) return;
    // Toplam talebe
    authFetch(`${config.API_BASE_URL}/student`)
      .then(res => res.json())
      .then(data => setStudentCount(data.length))
      .catch(() => setStudentCount(null));

    // Toplam Dahili Seviye
    authFetch(`${config.API_BASE_URL}/class`)
      .then(res => res.json())
      .then(data => setClassCount(data.length))
      .catch(() => setClassCount(null));

    // Toplam program
    authFetch(`${config.API_BASE_URL}/program`)
      .then(res => res.json())
      .then(data => setProgramCount(data.length))
      .catch(() => setProgramCount(null));

    // Bugünkü yoklama (sabah)
    const today = new Date().toISOString().slice(0, 10);
    authFetch(`${config.API_BASE_URL}/attendance/dailyprogram?date=${today}&program_name=sabah_namazi`)
      .then(res => res.json())
      .then(data => {
        setAttendanceCount(Array.isArray(data) ? data.length : 0);
        // Calculate attendance rate if possible
        if (Array.isArray(data) && studentCount) {
          const present = data.filter((d: any) => d.attendance_type_name === 'var').length;
          setAttendanceRate(studentCount > 0 ? Math.round((present / studentCount) * 100) : null);
        }
      })
      .catch(() => {
        setAttendanceCount(null);
        setAttendanceRate(null);
      });
  }, [studentCount, isTalebe]);

  useEffect(() => {
    // Skip for talebe users
    if (isTalebe) return;

    // Calculate current month range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    // Fetch statistics for current month
    authFetch(`${config.API_BASE_URL}/attendance/statistics?startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        // Sort by "var" percentage descending and take top 5
        const sorted = [...data].sort((a, b) => (b.percentages.var ?? 0) - (a.percentages.var ?? 0));
        setMonthlyTop(sorted.slice(0, 5));
      })
      .catch(() => setMonthlyTop([]));
  }, [isTalebe]);

  // Talebe Home View
  if (isTalebe) {
    const currentMonth = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    return (
      <div className="container py-4" style={{ maxWidth: 1200 }}>
        {/* Welcome Header */}
        <div className="mb-5 text-center">
          <h1 className="display-4 fw-bold mb-2" style={{ color: '#0d6efd' }}>
            Merhaba, {user?.username}! 👋
          </h1>
          <p className="text-muted fs-5">
            {currentMonth} ayı performansın
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : myStatistics ? (
          <>
            {/* Overall Performance Card */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-lg border-0" style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  color: 'white'
                }}>
                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      <div className="col-md-8">
                        <h3 className="mb-3">
                          <strong>{myStatistics.name}</strong>
                        </h3>
                        <p className="mb-2 fs-5">
                          <strong>Dahili Seviye:</strong> {getTurkishClassName(myStatistics.class_name)}
                        </p>
                        <p className="mb-0 opacity-75">
                          Toplam Yoklama: {myStatistics.total}
                        </p>
                      </div>
                      <div className="col-md-4 text-center">
                        {(() => {
                          const { genel } = getProgramSums(myStatistics);
                          let badgeClass = 'bg-success';
                          let text = 'Çok İyi!';
                          let emoji = '🌟';
                          if (genel < 60) {
                            badgeClass = 'bg-danger';
                            text = 'Geliştirilmeli';
                            emoji = '📈';
                          } else if (genel < 80) {
                            badgeClass = 'bg-warning';
                            text = 'İyi';
                            emoji = '👍';
                          }
                          return (
                            <div>
                              <div className="display-1 fw-bold mb-2">{genel}%</div>
                              <div className="fs-4 fw-bold mb-2">Genel Performans</div>
                              <span className={`badge ${badgeClass} fs-5 px-4 py-2`}>
                                {emoji} {text}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Program Performance Grid */}
            <div className="row g-3 mb-4">
              {(() => {
                const { programSums, programPercentages } = getProgramSums(myStatistics);
                const programsWithAnyRecords = getProgramsWithRecords();

                return Array.from(programsWithAnyRecords).map((program) => {
                  const programData = programPercentages[program];
                  if (!programData) return null;

                  const percentage = programData.var + programData.izinli;
                  let bgGradient = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                  let textColor = 'text-white';

                  if (percentage < 60) {
                    bgGradient = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
                  } else if (percentage < 80) {
                    bgGradient = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
                  }

                  return (
                    <div key={program} className="col-md-4 col-sm-6">
                      <div className="card shadow-sm border-0 h-100" style={{
                        background: bgGradient,
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div className="card-body text-center text-white">
                          <h5 className="card-title mb-3 fw-bold">
                            {PROGRAM_TURKISH_MAP[program]}
                          </h5>
                          <div className="display-4 fw-bold mb-3">{percentage}%</div>
                          <div className="small opacity-75">
                            <div>Var: {programData.var}%</div>
                            <div>İzinli: {programData.izinli}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Attendance Breakdown */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Detaylı İstatistikler</h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-3 col-6 mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#d4edda' }}>
                          <div className="display-6 fw-bold text-success">
                            {myStatistics.percentages.var || 0}%
                          </div>
                          <div className="text-muted">Var</div>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#fff3cd' }}>
                          <div className="display-6 fw-bold text-warning">
                            {myStatistics.percentages.izinli || 0}%
                          </div>
                          <div className="text-muted">İzinli</div>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#f8d7da' }}>
                          <div className="display-6 fw-bold text-danger">
                            {myStatistics.percentages.yok || 0}%
                          </div>
                          <div className="text-muted">Yok</div>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 mb-3">
                        <div className="p-3 rounded" style={{ backgroundColor: '#e2e3e5' }}>
                          <div className="display-6 fw-bold text-secondary">
                            {myStatistics.percentages.gec || 0}%
                          </div>
                          <div className="text-muted">Geç</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="row">
              <div className="col-12">
                <div className="alert alert-info border-0 shadow-sm" style={{
                  background: 'linear-gradient(135deg, #1e40af22 0%, #3b82f622 100%)'
                }}>
                  <div className="d-flex align-items-center">
                    <div className="fs-1 me-3">💡</div>
                    <div>
                      <h5 className="alert-heading mb-2">İpucu</h5>
                      <p className="mb-0">
                        {(() => {
                          const { genel } = getProgramSums(myStatistics);
                          if (genel >= 80) {
                            return "Mükemmel bir performans sergiliyorsun! Bu şekilde devam et. 🌟";
                          } else if (genel >= 60) {
                            return "İyi gidiyorsun! Biraz daha çaba ile çok daha iyi olabilirsin. 💪";
                          } else {
                            return "Performansını artırmak için düzenli katılım göstermeye çalış. Başarabilirsin! 🚀";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title mb-3">Hızlı Erişim</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/student-portal')}
                      >
                        📊 Detaylı İstatistikler
                      </button>
                      <button
                        className="btn btn-outline-primary btn-lg"
                        onClick={() => navigate('/profile')}
                      >
                        ⚙️ Profil Ayarları
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-5">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <div className="fs-1 mb-3">📊</div>
                <h3 className="mb-3">Henüz Veri Yok</h3>
                <p className="text-muted mb-0">
                  Bu ay için henüz yoklama kaydın bulunmuyor. İlk yoklaman alındığında istatistiklerin burada görünecek.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin/Hoca/Yoklamaci Home View
  return (
    <div className="container-fluid py-4">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold mb-2" style={{ color: '#0d6efd' }}>
          Hoş Geldiniz, {user?.username}! 👋
        </h1>
        <p className="text-muted fs-5">
          Bugünün Tarihi: {new Date().toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {/* Total Students Card */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            transition: 'transform 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-2 opacity-75">Toplam Talebe</h6>
                  <h2 className="display-4 fw-bold mb-0">
                    {studentCount !== null ? studentCount : '...'}
                  </h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>👥</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Classes Card */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
            transition: 'transform 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-2 opacity-75">Dahili Seviye</h6>
                  <h2 className="display-4 fw-bold mb-0">
                    {classCount !== null ? classCount : '...'}
                  </h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>📚</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Programs Card */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            transition: 'transform 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-2 opacity-75">Program Sayısı</h6>
                  <h2 className="display-4 fw-bold mb-0">
                    {programCount !== null ? programCount : '...'}
                  </h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>📋</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Attendance Rate Card */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            transition: 'transform 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-2 opacity-75">Bugünkü Katılım</h6>
                  <h2 className="display-4 fw-bold mb-0">
                    {attendanceRate !== null ? `${attendanceRate}%` : '...'}
                  </h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>✅</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold">🏆 Aylık En İyi Performans (Top 5)</h5>
              <small className="text-muted">
                {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </small>
            </div>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const startDate = start.toISOString().slice(0, 10);
                const endDate = end.toISOString().slice(0, 10);
                localStorage.setItem('statistics-startDate', startDate);
                localStorage.setItem('statistics-endDate', endDate);
                localStorage.setItem('statistics-autofetch', '1');
                navigate('/statistics');
              }}
            >
              Tümünü Gör →
            </button>
          </div>
        </div>
        <div className="card-body">
          {monthlyTop.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 mb-3">📊</div>
              <p className="text-muted">Bu ay için henüz veri yok</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="border-0" style={{ width: '60px' }}>Sıra</th>
                    <th className="border-0">Talebe</th>
                    <th className="border-0">Dahili Seviye</th>
                    <th className="border-0 text-center">Katılım</th>
                    <th className="border-0 text-end">Performans</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTop.map((s, i) => {
                    const percentage = s.percentages.var ?? 0;
                    let badgeClass = 'success';
                    let medal = '';

                    if (i === 0) medal = '🥇';
                    else if (i === 1) medal = '🥈';
                    else if (i === 2) medal = '🥉';

                    if (percentage < 60) badgeClass = 'danger';
                    else if (percentage < 80) badgeClass = 'warning';

                    return (
                      <tr key={s.studentid}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fs-5 me-2">{medal}</span>
                            <span className="fw-bold">{i + 1}</span>
                          </div>
                        </td>
                        <td className="fw-semibold">{s.name}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {getTurkishClassName(s.class_name)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary">
                            {s.total} yoklama
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`badge bg-${badgeClass} fs-6 px-3`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
