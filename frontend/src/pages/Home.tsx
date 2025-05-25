import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import DashboardStats from '../components/DashboardStats';
import RecentAttendance from '../components/RecentAttendance';
import QuickLinks from '../components/QuickLinks';

const Home = () => {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    authFetch('http://localhost:3001/student')
      .then(res => res.json())
      .then(data => setStudentCount(data.length))
      .catch(() => setStudentCount(null));

    const today = new Date().toISOString().slice(0, 10);
    authFetch(`http://localhost:3001/attendance/dailyprogram?date=${today}&program_name=sabah_namazi`)
      .then(res => res.json())
      .then(data => setAttendanceCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setAttendanceCount(null));

    authFetch('http://localhost:3001/attendance/all')
      .then(res => res.json())
      .then(data => setRecentAttendance(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRecentAttendance([]));
  }, []);

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-center">SarayApp Dashboard</h1>
      <DashboardStats studentCount={studentCount} attendanceCount={attendanceCount} />
      <QuickLinks />
      <RecentAttendance records={recentAttendance} />
    </div>
  );
};

export default Home;
