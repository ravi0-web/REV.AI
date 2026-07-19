import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, BarChart3, Sun, Moon, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">R</span>
          Rev<span className="brand-dot">.</span>AI
        </NavLink>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <ul className="navbar-links navbar-desktop-only">
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

        {/* Right section */}
        <div className="navbar-right">
          {/* Desktop auth controls */}
          <div className="navbar-desktop-only">
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="btn btn-primary btn-sm">
                <LogIn size={16} />
                Login
              </NavLink>
            )}
          </div>

          <div className="navbar-divider"></div>

          {/* Theme Toggle */}
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

          {/* Hamburger Button (Mobile Only) */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
        {isAuthenticated ? (
          <>
            {/* User Info */}
            <div className="mobile-user-section">
              <div className="user-avatar user-avatar-lg">
                {user?.name?.charAt(0).toUpperCase() || <User size={18} />}
              </div>
              <div>
                <div className="mobile-user-name">{user?.name || 'User'}</div>
                <div className="mobile-user-email">{user?.email || ''}</div>
              </div>
            </div>

            <div className="mobile-menu-divider" />

            {/* Nav Links */}
            <NavLink to="/" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`} end>
              <Home size={18} /> <span>Analyze Reviews</span>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>
              <Clock size={18} /> <span>Review History</span>
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} /> <span>Analytics Dashboard</span>
            </NavLink>

            <div className="mobile-menu-divider" />

            {/* Logout */}
            <button className="mobile-menu-link mobile-logout-btn" onClick={logout}>
              <LogOut size={18} /> <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="mobile-menu-link">
              <LogIn size={18} /> <span>Login</span>
            </NavLink>
            <NavLink to="/register" className="mobile-menu-link">
              <User size={18} /> <span>Create Account</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
