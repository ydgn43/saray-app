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
    const collapse = document.getElementById('navbarNavDropdown');
    const links = document.querySelectorAll('.navbar-collapse .nav-link');

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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={logo} alt="User Icon" style={{ width: 60, height: 60, color: "#1863ae" }} className="mb-1" />
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
              >
                Yoklama
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/attendance">Günlük</Link></li>
                <li><Link className="dropdown-item" to="/statistics">İstatistik</Link></li>
                <li><Link className="dropdown-item" to="/talebeler">Talebeler</Link></li>
              </ul>
            </li>
            {user && (
              <>
                <li className="nav-item d-flex align-items-center ms-2">
                  <span className="text-white small me-2">
                    Hoşgeldin, {user.username} ({user.role})
                  </span>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={logout}
                    style={{ marginLeft: '8px' }}
                  >
                    Çıkış
                  </button>
                </li>
              </>
            )}
            {!user && (
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
