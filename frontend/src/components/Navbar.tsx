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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary flex-lg-column align-items-start px-3 py-3 position-lg-fixed top-0 bottom-0 start-0 shadow-sm z-3" style={{ width: '250px' }}>
      <Link className="navbar-brand d-flex align-items-center gap-2 mb-3" to="/">
        <img src={logo} alt="Efendim! Logo" style={{ width: 40, height: 40 }} />
        <span style={{ fontSize: 20 }}>Efendim!</span>
      </Link>

      <button
        className="navbar-toggler mb-3"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavDropdown"
        aria-controls="navbarNavDropdown"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse w-100" id="navbarNavDropdown">
        <ul className="navbar-nav flex-lg-column w-100">
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
            <ul className="dropdown-menu">
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
              <ul className="dropdown-menu">
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
    </nav>
  );
};

export default Navbar;
