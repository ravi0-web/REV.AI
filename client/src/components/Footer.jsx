import { Link } from 'react-router-dom';
import { Mail, Globe, MessageCircle, Share2 } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-card)',
      padding: 'var(--space-2xl) var(--space-xl) var(--space-lg)',
      marginTop: 'auto',
      zIndex: 10
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-2xl)'
      }}>
        
        {/* Brand Section */}
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: 'var(--space-md)' }}>
            <div className="brand-icon" style={{ width: '32px', height: '32px', fontSize: '1.2rem' }}>R</div>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Rev<span style={{ color: 'var(--color-primary)' }}>.</span>AI
            </span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 'var(--space-lg)' }}>
            Elevating hospitality management with AI-powered review analysis. Turn guest feedback into actionable insights instantly.
          </p>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
            <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'inherit'}><MessageCircle size={20} /></a>
            <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'inherit'}><Globe size={20} /></a>
            <a href="#" style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--color-primary)'} onMouseOut={e => e.target.style.color = 'inherit'}><Share2 size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: '600' }}>Platform</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Analyze Reviews</Link></li>
            <li><Link to="/history" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>History & Logs</Link></li>
            <li><Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Analytics Dashboard</Link></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>API Documentation</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: '600' }}>Resources</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Help Center</a></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Best Practices Guide</a></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Community Forum</a></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>Status Page</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)', fontSize: '1rem', fontWeight: '600' }}>Contact</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Mail size={16} /> support@rev.ai
            </li>
            <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Himmatpur Talla<br />
              Nainital, Uttarakhand, India
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: 'var(--space-2xl) auto 0',
        paddingTop: 'var(--space-lg)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-md)'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          &copy; {currentYear} Rev.AI Technologies. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>Terms of Service</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
