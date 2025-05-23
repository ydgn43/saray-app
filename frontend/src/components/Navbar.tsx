import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logo from '../images/logo.png';

declare global {
  interface Window {
    bootstrap: any;
  }
}

const Navbar = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    // Collapse menu on link click (for mobile UX)
    const collapse = document.getElementById('navbarNavDropdown');
    const links = document.querySelectorAll('.navbar-collapse .nav-link, .navbar-collapse .dropdown-item');
    links.forEach((link) => {
      link.addEventListener('click', () => {
        if (collapse?.classList.contains('show')) {
          new window.bootstrap.Collapse(collapse).hide();
        }
      });
    });
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm z-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-white" to="/">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="SarayApp Logo" style={{ width: 48, height: 48 }} className="mb-1" />
            <span style={{ fontSize: 22, fontWeight: 600 }}>SarayApp</span>
          </div>
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
          <span className="navbar-toggler-icon" />
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
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Yoklama
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/attendance">Günlük</Link></li>
                <li><Link className="dropdown-item" to="/statistics">İstatistik</Link></li>
                <li><Link className="dropdown-item" to="/talebeler">Talebeler</Link></li>
              </ul>
            </li>
            {user ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-2" style={{ fontSize: 20 }}></i>
                  <span>{user.username} ({user.role})</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <NavLink to="/settings" className="dropdown-item">
                      Ayarlar
                    </NavLink>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={logout}
                      type="button"
                    >
                      Çıkış
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link text-white" to="/login">Login</NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
