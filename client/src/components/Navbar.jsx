import { NavLink } from 'react-router-dom';
import { Home, Clock, BarChart3, Sun, Moon, LogIn, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">R</span>
          Rev<span className="brand-dot">.</span>AI
        </NavLink>

        {/* Navigation Links (Only if authenticated) */}
        {isAuthenticated && (
          <ul className="navbar-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                <Home size={16} /> Analyze
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
                <Clock size={16} /> History
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                <BarChart3 size={16} /> Dashboard
              </NavLink>
            </li>
          </ul>
        )}

        {/* Right section: Auth & Theme toggle */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                </div>
                <span className="hide-mobile">{user?.name?.split(' ')[0]}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
                <LogOut size={16} />
                <span className="hide-mobile">Logout</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              <LogIn size={16} />
              Login
            </NavLink>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            id="theme-toggle-btn"
          >
            <div className="theme-toggle-knob">
              {theme === 'light' ? <Sun size={12} /> : <Moon size={12} />}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
