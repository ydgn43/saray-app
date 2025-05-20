import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div className="container-fluid">
        <div className="collapse navbar-collapse show">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Ana Sayfa</NavLink>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown">
                Yoklama
              </a>
              <ul className="dropdown-menu show-static">
                <li><Link className="dropdown-item" to="/attendance">Günlük</Link></li>
                <li><Link className="dropdown-item" to="/statistics">Istatistik</Link></li>
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
