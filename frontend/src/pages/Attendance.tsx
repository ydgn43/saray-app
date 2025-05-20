import { useState, useEffect } from 'react';
import AttendanceTable from '../components/AttendanceTable';

const Attendance = () => {
  const [date, setDate] = useState('');
  const [program, setProgram] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateButton, setShowCreateButton] = useState(false);

  // Fetch students on load
  useEffect(() => {
    fetch('http://localhost:3001/student')
      .then((res) => res.json())
      .then(setStudents)
      .catch(console.error);
  }, []);

  // Fetch attendance data
  const loadAttendanceData = async () => {
  if (!date || !program) return;
  const res = await fetch(`http://localhost:3001/attendance/dailyprogram?date=${date}&program_name=${program}`);
  const data = await res.json();
  setAttendanceData(data);
  setShowCreateButton(data.length === 0);
};


  const handleCreateAttendance = async () => {
  if (!date || !program) {
    alert('Lütfen tarih ve program seçiniz.');
    return;
  }

  const payload = students.map((s: any) => ({
    studentid: s.studentid,
    date,
    program_name: program,
    attendance_type_name: '', // initially no status
  }));

  try {
    await fetch('http://localhost:3001/attendance/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Yeni yoklama başarıyla oluşturuldu');
    setShowCreateButton(false);
    loadAttendanceData(); // refresh the list
  } catch (err) {
    console.error('Yeni yoklama oluşturulurken hata:', err);
    alert('Oluşturma başarısız oldu');
  }
};

  return (
    <div className="container mt-4">
      <h1>Günlük Yoklama</h1>

      {/* Form */}
      <div className="row">
        <div className="col-md-4">
          <label>Tarih:</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label>Program:</label>
          <select
            className="form-select"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">Program Seçin</option>
            <option value="sabah namazi">Sabah Namazı</option>
            <option value="Ögle Namazi">Öğle Namazı</option>
            <option value="Ikindi Namazi">İkindi Namazı</option>
            <option value="Aksam Namazi">Akşam Namazı</option>
            <option value="Yatsi Namazi">Yatsı Namazı</option>
            <option value="Hatim">Hatim</option>
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button onClick={loadAttendanceData}>Göster</button>
        </div>
      </div>

      {/* Create Button */}
      {showCreateButton && (
        <button className="btn btn-success mt-3" onClick={handleCreateAttendance}>
          Yeni Yoklama Oluştur
        </button>
      )}

      {/* Table */}
      <AttendanceTable
        students={students}
        attendanceData={attendanceData}
        date={date}
        program={program}
        onChange={loadAttendanceData}
        />
    </div>
  );
};

export default Attendance;
