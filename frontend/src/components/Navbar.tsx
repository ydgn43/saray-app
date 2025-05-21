// src/components/Navbar.tsx
import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
          <span className="navbar-toggler-icon" />
        </button>
        <ul>
          {user && (
            <>
              <li>Welcome, {user.username} ({user.role})</li>
              <li><button onClick={logout}>Logout</button></li>
            </>
          )}
          {!user && (
            <li><a href="/login">Login</a></li>
          )}
        </ul>

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
