import { useState } from 'react';
import { Download, Table, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { exportToCSV, downloadFile, THEME_ICONS } from '../services/api';

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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={handleCopy}
      title="Copy response"
      style={{ padding: '4px 8px', minWidth: 'auto' }}
    >
      {copied ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
    </button>
  );
}

export default function ResultsTable({ results }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  if (!results || results.length === 0) return null;

  const toggleRow = (idx) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const counts = results.reduce(
    (acc, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const handleExport = () => {
    const csv = exportToCSV(results);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `revai-results-${timestamp}.csv`);
  };

  return (
    <div className="results-section animate-in animate-in-delay-1">
      {/* Header with stats */}
      <div className="results-header">
        <div className="results-meta">
          <div className="card-title">
            <span className="icon accent"><Table size={16} /></span>
            Analysis Results
          </div>
          <div className="results-stat">
            <span className="stat-value positive">{counts.positive}</span> positive
          </div>
          <div className="results-stat">
            <span className="stat-value neutral">{counts.neutral}</span> neutral
          </div>
          <div className="results-stat">
            <span className="stat-value negative">{counts.negative}</span> negative
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExport} id="export-csv-btn">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="results-table" id="results-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th>Review</th>
              <th style={{ width: '120px' }}>Sentiment</th>
              <th style={{ width: '130px' }}>Theme</th>
              <th>Suggested Response</th>
              <th style={{ width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => {
              const isExpanded = expandedRows.has(idx);
              const isLong = result.reviewText.length > 150;

              return (
                <tr key={result._id || idx}>
                  <td className="cell-number">{idx + 1}</td>
                  <td className="review-text-cell">
                    <div className={isLong && !isExpanded ? 'truncated' : ''}>
                      {result.reviewText}
                    </div>
                    {isLong && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleRow(idx)}
                        style={{ padding: '2px 6px', marginTop: '4px', fontSize: '0.75rem' }}
                      >
                        {isExpanded ? (
                          <><ChevronUp size={12} /> Less</>
                        ) : (
                          <><ChevronDown size={12} /> More</>
                        )}
                      </button>
                    )}
                  </td>
                  <td>
                    <SentimentBadge sentiment={result.sentiment} />
                  </td>
                  <td>
                    <ThemeTag theme={result.theme} />
                  </td>
                  <td className="response-cell">
                    {result.response}
                  </td>
                  <td>
                    <CopyButton text={result.response} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
