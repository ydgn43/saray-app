// src/components/Navbar.tsx
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-white" to="/">
          SarayApp
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/">Ana Sayfa</NavLink>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle text-white"
                href="#"
                id="yoklamaDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Yoklama
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/attendance">Günlük</Link></li>
                <li><Link className="dropdown-item" to="/statistics">İstatistik</Link></li>
                <li><Link className="dropdown-item" to="/settings">Ayarlar</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
