import { useEffect, useState } from 'react';

type Student = {
  studentid: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  season: string;
  class_name: string;
};

const Settings = () => {
  const [students, setStudents] = useState<Student[]>([]);

  // Form fields
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [birth_date, setBirthDate] = useState('');
  const [season, setSeason] = useState('');
  const [class_name, setClassName] = useState('');

  const loadStudents = async () => {
    try {
      const res = await fetch('http://localhost:3001/student');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Talebe listesi alınamadı:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm('Bu talebeyi silmek istediğinize emin misiniz?');
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:3001/student/delete?studentid=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        if (res.status === 409 || res.status === 500) {
          alert('Bu talebenin yoklama verisi mevcut. Önce yoklamaları silin.');
        } else {
          alert('Silme işlemi başarısız oldu.');
        }
        return;
      }

      alert('Talebe silindi');
      loadStudents();
    } catch (err) {
      console.error(err);
      alert('Silme işlemi sırasında beklenmedik bir hata oluştu.');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        if (!first_name || !last_name || !birth_date || !season || !class_name) {
             alert('Lütfen tüm alanları doldurun.');
        return;
        }
        console.log('Sending:', {
            first_name,
            last_name,
            birth_date,
            season,
            class_name,
        });

      const res = await fetch('http://localhost:3001/student/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          birth_date,
          season_year: season,
          class_name,
        }),
      });

      if (!res.ok) throw new Error('Ekleme başarısız');
      alert('Talebe başarıyla eklendi');

      // Clear form
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setSeason('');
      setClassName('');

      loadStudents();
    } catch (err) {
      console.error(err);
      alert('Talebe eklenirken hata oluştu');
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="container mt-4">
      <h1>Ayarlar</h1>

      <h3>Mevcut Talebeler</h3>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>İsim</th>
            <th>Soyisim</th>
            <th>Sınıf</th>
            <th>Sezon</th>
            <th>Doğum Tarihi</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.studentid}>
              <td>{s.studentid}</td>
              <td>{s.first_name}</td>
              <td>{s.last_name}</td>
              <td>{s.class_name}</td>
              <td>{s.season}</td>
              <td>{s.birth_date}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.studentid)}>
                  Sil
                </button>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center">Kayıtlı talebe bulunamadı.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="mt-5">Yeni Talebe Ekle</h3>
      <form onSubmit={handleAddStudent}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>İsim</label>
            <input className="form-control" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Soyisim</label>
            <input className="form-control" value={last_name} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Doğum Tarihi</label>
            <input type="date" className="form-control" value={birth_date} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Sezon</label>
            <select className="form-select" value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">Sezon Seç</option>
              {Array.from({ length: 33 }).map((_, i) => {
                const year = 2018 + i;
                return (
                  <option key={year} value={`${year}/${year + 1}`}>
                    {year}/{year + 1}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Sınıf Adı</label>
            <select className="form-select" value={class_name} onChange={(e) => setClassName(e.target.value)}>
              <option value="">Sınıf Seç</option>
              <option value="kuranikerim">Kuran-ı Kerim</option>
              <option value="hazirlik">Hazırlık</option>
              <option value="ibtidati">İbtidati</option>
              <option value="ihzari">İhzari</option>
              <option value="mevzun_tekamul_alti">Mezun Tekamul Altı</option>
              <option value="tekamul_alti">Tekamul Altı</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-success">Ekle</button>
      </form>
    </div>
  );
};

export default Settings;
