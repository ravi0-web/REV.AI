import { NavLink } from 'react-router-dom';
import { Home, Clock, BarChart3, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">R</span>
          Rev<span className="brand-dot">.</span>AI
        </NavLink>

        {/* Navigation Links */}
        <ul className="navbar-links">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => isActive ? 'active' : ''}
              end
            >
              <Home size={16} />
              Analyze
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/history"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <Clock size={16} />
              History
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <BarChart3 size={16} />
              Dashboard
            </NavLink>
          </li>
        </ul>

        {/* Right section: Theme toggle */}
        <div className="navbar-right">
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
