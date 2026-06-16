import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import ResultsTable from '../components/ResultsTable';
import { analyzeReviews, saveToHistory } from '../services/api';

export default function Home() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAnalyze = async (reviews) => {
    setIsLoading(true);
    setResults([]);

    try {
      const analysisResults = await analyzeReviews(reviews);
      setResults(analysisResults);
      saveToHistory(analysisResults);

      const pos = analysisResults.filter(r => r.sentiment === 'positive').length;
      const neg = analysisResults.filter(r => r.sentiment === 'negative').length;
      showToast(
        `✅ Analyzed ${analysisResults.length} review${analysisResults.length > 1 ? 's' : ''} — ${pos} positive, ${neg} negative`,
        'success'
      );
    } catch (err) {
      showToast('❌ Analysis failed. Please try again.', 'error');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Trishul Eco-Homestays
          </div>
          <h1>Guest Review Intelligence</h1>
          <p>
            Paste guest reviews to instantly classify sentiment, detect themes,
            and generate professional management responses powered by AI.
          </p>
        </section>

        {/* Review Form */}
        <ReviewForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* Loading State */}
        {isLoading && (
          <div className="card animate-fade">
            <div className="loading-overlay">
              <div className="spinner spinner-lg" />
              <div>
                <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--color-primary-light)' }} />
                AI is analyzing your reviews...
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Classifying sentiment, detecting themes, generating responses
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <ResultsTable results={results} />
        )}

        {/* Empty state when nothing has been analyzed yet */}
        {!isLoading && results.length === 0 && (
          <div className="card animate-in animate-in-delay-2" style={{ marginTop: 'var(--space-xl)' }}>
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>Ready to analyze reviews</p>
              <p className="empty-sub">
                Paste guest reviews above or click "Load Samples" to try it out.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
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
