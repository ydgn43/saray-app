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

  // Fetch data for talebe users
  useEffect(() => {
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

      // Fetch statistics
      const statsRes = await authFetch(
        `${config.API_BASE_URL}/attendance/statistics?startDate=${startDate}&endDate=${endDate}`
      );
      if (statsRes.ok) {
        const data = await statsRes.json();
        const myStats = data.find((s: StatisticEntry) => s.studentid === userStudentId);
        setMyStatistics(myStats || null);
      }

      // Fetch attendance records
      const recordsRes = await authFetch(
        `${config.API_BASE_URL}/attendance/all?startDate=${startDate}&endDate=${endDate}`
      );
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('Error fetching talebe statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  function computeProgramPercentages(
    stat: StatisticEntry,
    attendanceRecords: any[]
  ): Record<string, { var: number; izinli: number }> {
    if (!attendanceRecords.length) {
      return {};
    }
    const studentRecords = attendanceRecords.filter(
      (rec) => rec.studentid === stat.studentid
    );
    const programMap: Record<string, { var: number; izinli: number; total: number }> = {};
    studentRecords.forEach((rec) => {
      const prog = normalizeProgramName(rec.program_name);
      if (!programMap[prog]) programMap[prog] = { var: 0, izinli: 0, total: 0 };
      if (rec.attendance_type_name === 'var') programMap[prog].var += 1;
      if (rec.attendance_type_name === 'izinli') programMap[prog].izinli += 1;
      programMap[prog].total += 1;
    });
    const result: Record<string, { var: number; izinli: number }> = {};
    Object.entries(programMap).forEach(([prog, { var: v, izinli: i, total }]) => {
      result[prog] = {
        var: total ? Math.round((v / total) * 100) : 0,
        izinli: total ? Math.round((i / total) * 100) : 0,
      };
    });
    return result;
  }

  const getProgramSums = (stat: StatisticEntry) => {
    const programPercentages = computeProgramPercentages(stat, attendanceRecords);
    const programSums = PROGRAM_ORDER.map((program) => {
      const prog = programPercentages[program] || { var: 0, izinli: 0 };
      return prog.var + prog.izinli;
    });
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                return PROGRAM_ORDER.map((program, idx) => {
                  const percentage = programSums[idx];
                  const programData = programPercentages[program] || { var: 0, izinli: 0 };
                  let bgGradient = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                  let textColor = 'text-white';

                  if (percentage < 60) {
                    bgGradient = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
                  } else if (percentage < 80) {
                    bgGradient = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
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
                  background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)'
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
    <div>
      <h1 className="mb-4 text-center">Efendim! Dashboard</h1>
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h6 className="card-title">Toplam Talebe</h6>
              <p className="display-6">{studentCount !== null ? studentCount : '...'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h6 className="card-title">Toplam Dahili Seviye</h6>
              <p className="display-6">{classCount !== null ? classCount : '...'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h6 className="card-title">Toplam Program</h6>
              <p className="display-6">{programCount !== null ? programCount : '...'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm text-center">
            <div className="card-body">
              <h6 className="card-title">Bugünkü Yoklama Oranı</h6>
              <p className="display-6">
                {attendanceRate !== null ? `${attendanceRate}%` : '...'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-12 mb-3">
          <div
            className="card shadow-sm"
            style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            onClick={() => {
              // Set dates in localStorage and navigate
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              const startDate = start.toISOString().slice(0, 10);
              const endDate = end.toISOString().slice(0, 10);
              localStorage.setItem('statistics-startDate', startDate);
              localStorage.setItem('statistics-endDate', endDate);
              // Optionally, you can set a flag to auto-fetch on Statistics page
              localStorage.setItem('statistics-autofetch', '1');
              navigate('/statistics');
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 0 0.2rem #0d6efd33')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,.075)')}
          >
            <div className="card-body">
              <h5 className="card-title mb-3">Aylık Katılım (Top 5)</h5>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>İsim</th>
                    <th>Dahili Seviye</th>
                    <th>Var (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTop.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center">Veri yok</td>
                    </tr>
                  ) : (
                    monthlyTop.map((s, i) => (
                      <tr key={s.studentid}>
                        <td>{i + 1}</td>
                        <td>{s.name}</td>
                        <td>{s.class_name}</td>
                        <td>{s.percentages.var ?? 0}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* ...rest of dashboard... */}
    </div>
  );
};

export default Home;
