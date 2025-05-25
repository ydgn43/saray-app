import React from 'react';
import { Link } from 'react-router-dom';

const QuickLinks = () => (
  <div className="card shadow-sm text-center mb-4">
    <div className="card-body">
      <h5 className="card-title">Hızlı Erişim</h5>
      <div className="d-flex flex-column gap-2">
        <Link className="btn btn-outline-primary" to="/attendance">Yoklama</Link>
        <Link className="btn btn-outline-info" to="/statistics">İstatistik</Link>
        <Link className="btn btn-outline-success" to="/talebeler">Talebeler</Link>
        <Link className="btn btn-outline-secondary" to="/settings">Ayarlar</Link>
      </div>
    </div>
  </div>
);

export default QuickLinks;