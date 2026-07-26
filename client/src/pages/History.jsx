import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Download, Filter, Loader, Pencil } from 'lucide-react';
import { getHistory, clearHistory, searchReviews, exportToCSV, downloadFile, THEME_ICONS, updateReview, deleteReview } from '../services/api';

function SentimentBadge({ sentiment }) {
  return (
    <span className={`badge badge-${sentiment}`}>
      <span className="badge-dot" />
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
}

function ThemeTag({ theme }) {
  const icon = THEME_ICONS[theme] || '🏷️';
  return (
    <span className={`theme-tag ${theme}`}>
      <span className="theme-icon">{icon}</span>
      {theme.charAt(0).toUpperCase() + theme.slice(1)}
    </span>
  );
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const result = await getHistory({ page: 1, limit: 100 });
      const data = result.data || [];
      setHistory(data);
      setFilteredHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      showToast('❌ Failed to load review history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load all history from backend on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const handleEditSave = async (id) => {
    if (!editText || editText.trim().length < 5) {
      showToast('Review must be at least 5 characters', 'error');
      return;
    }
    try {
      await updateReview(id, editText);
      await loadHistory();
      showToast('Review updated', 'success');
      setEditingId(null);
      setEditText('');
    } catch (err) {
      showToast('❌ Failed to update review', 'error');
      console.error(err);
    }
  };

  const handleDeleteConfirm = async (id) => {
    try {
      await deleteReview(id);
      await loadHistory();
      showToast('Review deleted', 'success');
      setDeletingId(null);
    } catch (err) {
      showToast('❌ Failed to delete review', 'error');
      console.error(err);
    }
  };

  // Search & filter via backend whenever query or filter changes
  const applyFilters = useCallback(async () => {
    // If no filters are active, just show all history
    if (!searchQuery.trim() && sentimentFilter === 'all') {
      setFilteredHistory(history);
      return;
    }

    try {
      const result = await searchReviews({
        q: searchQuery,
        sentiment: sentimentFilter,
        limit: 100,
      });
      setFilteredHistory(result.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      // Fallback: client-side filter
      let filtered = history;
      if (sentimentFilter !== 'all') {
        filtered = filtered.filter(r => r.sentiment === sentimentFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
          r.reviewText.toLowerCase().includes(q) ||
          r.response.toLowerCase().includes(q) ||
          r.theme.toLowerCase().includes(q)
        );
      }
      setFilteredHistory(filtered);
    }
  }, [searchQuery, sentimentFilter, history]);

  // Debounced search — triggers 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [applyFilters]);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      try {
        await clearHistory();
        setHistory([]);
        setFilteredHistory([]);
        showToast('History cleared', 'success');
      } catch (err) {
        showToast('❌ Failed to clear history', 'error');
        console.error('Clear history error:', err);
      }
    }
  };

  const handleExport = () => {
    if (filteredHistory.length === 0) return;
    const csv = exportToCSV(filteredHistory);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `revai-history-${timestamp}.csv`);
    showToast(`Exported ${filteredHistory.length} reviews to CSV`, 'success');
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="hero" style={{ paddingBottom: 'var(--space-xl)', paddingTop: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: '2rem' }}>🕐 Review History</h1>
          <p>Browse and search all previously analyzed reviews</p>
        </div>

        {/* Controls */}
        <div className="card animate-in" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="history-controls">
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search reviews, themes, responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
                id="history-search"
              />
            </div>

            {/* Sentiment Filter */}
            <div className="filter-group">
              {['all', 'positive', 'neutral', 'negative'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${sentimentFilter === f ? 'active' : ''}`}
                  onClick={() => setSentimentFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              disabled={filteredHistory.length === 0}
            >
              <Download size={14} />
              Export
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClear}
              disabled={history.length === 0}
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
            <Filter size={12} style={{ verticalAlign: 'middle' }} />{' '}
            Showing {filteredHistory.length} of {history.length} reviews
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card animate-in animate-in-delay-1">
            <div className="loading-overlay">
              <div className="spinner spinner-lg" />
              <p>Loading review history...</p>
            </div>
          </div>
        )}

        {/* Table or Empty State */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="card animate-in animate-in-delay-1" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table className="results-table" id="history-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    <th>Review</th>
                    <th style={{ width: '120px' }}>Sentiment</th>
                    <th style={{ width: '130px' }}>Theme</th>
                    <th>Response</th>
                    <th style={{ width: '120px' }}>Date</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, idx) => {
                    const itemId = item._id || item.id || idx;
                    const isEditing = editingId === itemId;
                    const isDeleting = deletingId === itemId;
                    
                    return (
                      <tr key={itemId}>
                        <td className="cell-number">{idx + 1}</td>
                        <td className="review-text-cell">
                          {isEditing ? (
                            <div>
                              <textarea
                                className="review-textarea"
                                style={{ width: '100%', minHeight: '60px' }}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                              />
                              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleEditSave(itemId)}>Save</button>
                                <button className="btn btn-sm btn-ghost" onClick={() => { setEditingId(null); setEditText(''); }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="truncated">{item.reviewText}</div>
                          )}
                        </td>
                        <td><SentimentBadge sentiment={item.sentiment} /></td>
                        <td><ThemeTag theme={item.theme} /></td>
                        <td className="response-cell">{item.response}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(item.analyzedAt)}
                        </td>
                        <td>
                          {isDeleting ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Sure?</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteConfirm(itemId)}>Yes</button>
                                <button className="btn btn-sm btn-ghost" onClick={() => setDeletingId(null)}>No</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(itemId); setEditText(item.reviewText); setDeletingId(null); }} disabled={isEditing || isDeleting} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => { setDeletingId(itemId); setEditingId(null); }} disabled={isEditing || isDeleting} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && filteredHistory.length === 0 && (
          <div className="card animate-in animate-in-delay-1">
            <div className="empty-state">
              <div className="empty-icon">🕐</div>
              <p>{history.length === 0 ? 'No history yet' : 'No results match your filter'}</p>
              <p className="empty-sub">
                {history.length === 0
                  ? 'Analyzed reviews will appear here automatically.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
