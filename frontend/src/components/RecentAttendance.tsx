import React from 'react';

interface RecentAttendanceProps {
  records: any[];
}

const RecentAttendance: React.FC<RecentAttendanceProps> = ({ records }) => (
  <div>
    <h4 className="mb-3">Son Yoklama Kayıtları</h4>
    <div className="card shadow-sm">
      <div className="card-body p-0">
        <table className="table table-striped mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Talebe ID</th>
              <th>Tarih</th>
              <th>Program</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">Kayıt yok</td>
              </tr>
            ) : (
              records.map((rec, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{rec.studentid}</td>
                  <td>{rec.date}</td>
                  <td>{rec.program_name}</td>
                  <td>{rec.attendance_type_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default RecentAttendance;