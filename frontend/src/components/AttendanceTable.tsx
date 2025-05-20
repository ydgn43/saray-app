import React from 'react';

type Student = {
  studentid: number;
  first_name: string;
  last_name: string;
  class_name: string;
};

type Attendance = {
  studentid: number;
  attendance_type_name: string;
  sebep?: string;
};

type Props = {
  students: Student[];
  attendanceData: Attendance[];
  date: string;
  program: string;
  onChange: () => void;
};


const AttendanceTable: React.FC<Props> = ({ students, attendanceData, date, program, onChange }) => {
  const handleCheckboxChange = async (
  studentId: number,
  selectedType: string
) => {
  if (!date || !program) return;

  const checkUrl = `http://localhost:3001/attendance?studentid=${studentId}&date=${date}&program_name=${program}`;

  try {
    const checkRes = await fetch(checkUrl);
    const record = await checkRes.json();


    const method = checkRes.ok && record ? 'PUT' : 'POST';
    const url = checkRes.ok && record
      ? 'http://localhost:3001/attendance/put'
      : 'http://localhost:3001/attendance/create';

    const body = {
      studentid: studentId,
      date,
      program_name: program,
      attendance_type_name: selectedType,
      sebep: null,
    };

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    onChange(); // refresh UI
    console.log(`${method} successful for student ${studentId}`);
  } catch (err) {
    console.error('Error handling attendance change:', err);
  }
};

  return (
    <div className="mt-4">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Grup</th>
            <th>İsim</th>
            <th>Soyisim</th>
            <th>Var</th>
            <th>Geç</th>
            <th>Yok</th>
            <th>İzinli</th>
            <th>Sebep</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const record = attendanceData.find((a) => a.studentid === student.studentid);
            const current = record?.attendance_type_name?.toLowerCase();

            return (
              <tr key={student.studentid}>
                <td>{index + 1}</td>
                <td>{student.class_name}</td>
                <td>{student.first_name}</td>
                <td>{student.last_name}</td>

                {['var', 'gec', 'yok', 'izinli'].map((type) => (
                  <td key={type}>
                    <input
                      type="checkbox"
                      checked={current === type}
                      onChange={() => handleCheckboxChange(student.studentid, type)}
                    />
                  </td>
                ))}

                <td>{record?.sebep || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
