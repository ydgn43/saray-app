import { useState } from 'react';

type StatRow = {
  first_name: string;
  last_name: string;
  present_percent: number;
  izinli_percent: number;
};

const Statistics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<StatRow[]>([]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Lütfen başlangıç ve bitiş tarihlerini giriniz.');
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/attendance/statistics?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('İstatistik yüklenirken hata:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h1>İstatistik</h1>

      <div className="row mt-3">
        <div className="col-md-6">
          <label>Başlangıç Tarihi:</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label>Bitiş Tarihi:</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary mt-3" onClick={handleCalculate}>
        Yoklama Yüzdeliklerini Hesapla
      </button>

      <div className="mt-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>İsim</th>
              <th>Soyisim</th>
              <th>Var (%)</th>
              <th>İzinli (%)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.first_name}</td>
                <td>{row.last_name}</td>
                <td>{row.present_percent.toFixed(2)}</td>
                <td>{row.izinli_percent.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;
