import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import DashboardStats from '../components/DashboardStats';

const Home = () => {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [monthlyTop, setMonthlyTop] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Toplam talebe
    authFetch('https://api.efendim.nl
      / student')
        .then(res => res.json())
        .then(data => setStudentCount(data.length))
        .catch(() => setStudentCount(null));

    // Toplam sınıf
    authFetch('https://api.efendim.nl
      / class')
        .then(res => res.json())
        .then(data => setClassCount(data.length))
        .catch(() => setClassCount(null));

    // Toplam program
    authFetch('https://api.efendim.nl
      / program')
        .then(res => res.json())
        .then(data => setProgramCount(data.length))
        .catch(() => setProgramCount(null));

    // Bugünkü yoklama (sabah)
    const today = new Date().toISOString().slice(0, 10);
    authFetch(`https://api.efendim.nl
/attendance/dailyprogram?date=${today}&program_name=sabah_namazi`)
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
  }, [studentCount]);

  useEffect(() => {
    // Calculate current month range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    // Fetch statistics for current month
    authFetch(`https://api.efendim.nl
/attendance/statistics?startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        // Sort by "var" percentage descending and take top 5
        const sorted = [...data].sort((a, b) => (b.percentages.var ?? 0) - (a.percentages.var ?? 0));
        setMonthlyTop(sorted.slice(0, 5));
      })
      .catch(() => setMonthlyTop([]));
  }, []);

  return (
    <div className="container py-4">
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
              <h6 className="card-title">Toplam Sınıf</h6>
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
                    <th>Sınıf</th>
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
