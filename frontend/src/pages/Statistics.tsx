import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface StatisticEntry {
  studentid: number;
  student_name: string;
  total: number;
  percentages: {
    var?: number;
    gec?: number;
    yok?: number;
    izinli?: number;
  };
}

const Statistics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statistics, setStatistics] = useState<StatisticEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatistics = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen tarih aralığı seçin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/attendance/statistics?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatistics(data);
    } catch {
      toast.error("İstatistik verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <ToastContainer />
      <h1>Yoklama İstatistikleri</h1>

      <div className="row my-4">
        <div className="col-md-4">
          <label>Başlangıç Tarihi</label>
          <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label>Bitiş Tarihi</label>
          <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={fetchStatistics}>Verileri Getir</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      ) : (
        statistics.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>Talebe</th>
                  <th className="text">Var (%)</th>
                  <th className="text">Geç (%)</th>
                  <th className="text">Yok (%)</th>
                  <th className="text">İzinli (%)</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((s) => {
                  const varPercentage = s.percentages.var ?? 0;

                  let rowClass = '';
                  if (varPercentage >= 80) {
                    rowClass = 'table-success';
                  } else if (varPercentage >= 60) {
                    rowClass = 'table-warning';
                  } else {
                    rowClass = 'table-danger';
                  }

                  return (
                    <tr key={s.studentid} className={rowClass}>
                      <td className="text-start">{s.student_name}</td>
                      <td>{varPercentage}%</td>
                      <td>{s.percentages.gec ?? 0}%</td>
                      <td>{s.percentages.yok ?? 0}%</td>
                      <td>{s.percentages.izinli ?? 0}%</td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )
      )}
    </div>
  );
};

export default Statistics;
