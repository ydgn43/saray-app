import React from 'react';

interface DashboardStatsProps {
  studentCount: number | null;
  attendanceCount: number | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ studentCount, attendanceCount }) => (
  <div className="row mb-4">
    <div className="col-md-6 mb-3">
      <div className="card shadow-sm text-center">
        <div className="card-body">
          <h5 className="card-title">Toplam Talebe</h5>
          <p className="display-6">{studentCount !== null ? studentCount : '...'}</p>
        </div>
      </div>
    </div>
    <div className="col-md-6 mb-3">
      <div className="card shadow-sm text-center">
        <div className="card-body">
          <h5 className="card-title">Bugünkü Yoklama (Sabah)</h5>
          <p className="display-6">{attendanceCount !== null ? attendanceCount : '...'}</p>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardStats;