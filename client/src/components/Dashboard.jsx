import { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import {
  BarChart3,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  PieChart
} from 'lucide-react';
import { getDashboardData } from '../services/api';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Fetch dashboard stats from the backend on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const stats = await getDashboardData();
        setData(stats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        // Fallback to empty data
        setData({ total: 0, sentimentCounts: { positive: 0, neutral: 0, negative: 0 }, themeCounts: { food: 0, host: 0, location: 0, cleanliness: 0, value: 0, experience: 0 } });
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="hero" style={{ paddingBottom: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '2rem' }}>📊 Analytics Dashboard</h1>
            <p>Visualize trends across all analyzed reviews</p>
          </div>
          <div className="card">
            <div className="loading-overlay">
              <div className="spinner spinner-lg" />
              <p>Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { total, sentimentCounts, themeCounts } = data;
  const isDark = theme === 'dark';

  // Dynamic chart text color based on theme
  const textColor = isDark ? '#B8A494' : '#6B5444';
  const gridColor = isDark ? 'rgba(184, 148, 64, 0.08)' : 'rgba(226, 186, 106, 0.15)';
  const tooltipBg = isDark ? 'rgba(14, 10, 8, 0.95)' : 'rgba(255, 250, 245, 0.97)';
  const tooltipBorder = isDark ? 'rgba(184, 148, 64, 0.2)' : 'rgba(226, 186, 106, 0.3)';
  const tooltipTextColor = isDark ? '#F0E4D8' : '#3D2B1F';

  const positivePercent = total > 0
    ? Math.round((sentimentCounts.positive / total) * 100)
    : 0;

  // ---- Sentiment Pie Chart ---- //
  const sentimentChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
      backgroundColor: [
        isDark ? 'rgba(102, 187, 106, 0.8)' : 'rgba(46, 125, 50, 0.75)',
        isDark ? 'rgba(206, 170, 92, 0.8)' : 'rgba(191, 140, 44, 0.75)',
        isDark ? 'rgba(239, 83, 80, 0.8)' : 'rgba(198, 40, 40, 0.75)'
      ],
      borderColor: [
        isDark ? '#66BB6A' : '#2E7D32',
        isDark ? '#CEAA5C' : '#BF8C2C',
        isDark ? '#EF5350' : '#C62828'
      ],
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  const sentimentChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
          color: textColor
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTextColor,
        bodyColor: tooltipTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleFont: { weight: 600 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label}: ${val} (${pct}%)`;
          }
        }
      }
    }
  };

  // ---- Theme Bar Chart ---- //
  const themeLabels = Object.keys(themeCounts).map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const themeValues = Object.values(themeCounts);

  const themeChartData = {
    labels: themeLabels,
    datasets: [{
      label: 'Reviews',
      data: themeValues,
      backgroundColor: [
        'rgba(255, 152, 0, 0.65)',
        'rgba(237, 40, 57, 0.65)',
        'rgba(226, 186, 106, 0.65)',
        isDark ? 'rgba(102, 187, 106, 0.65)' : 'rgba(46, 125, 50, 0.6)',
        'rgba(156, 39, 176, 0.6)',
        'rgba(191, 140, 44, 0.6)'
      ],
      borderColor: [
        '#FF9800',
        '#ED2839',
        '#E2BA6A',
        isDark ? '#66BB6A' : '#2E7D32',
        '#AB47BC',
        '#BF8C2C'
      ],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  const themeChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTextColor,
        bodyColor: tooltipTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleFont: { weight: 600 },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { font: { size: 11 }, color: textColor }
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          font: { size: 11 },
          color: textColor,
          stepSize: 1,
          beginAtZero: true
        }
      }
    }
  };

  // ---- Empty State ---- //
  if (total === 0) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="hero" style={{ paddingBottom: 'var(--space-xl)' }}>
            <h1 style={{ fontSize: '2rem' }}>📊 Analytics Dashboard</h1>
            <p>Visualize trends across all analyzed reviews</p>
          </div>
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No review data yet</p>
              <p className="empty-sub">Analyze some reviews on the home page to see dashboard analytics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <div className="hero" style={{ paddingBottom: 'var(--space-xl)', paddingTop: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: '2rem' }}>📊 Analytics Dashboard</h1>
          <p>Aggregate sentiment and theme insights from all analyzed reviews</p>
        </div>

        {/* Stat Cards */}
        <div className="dashboard-grid animate-in">
          <div className="stat-card primary">
            <div className="stat-card-label">Total Reviews</div>
            <div className="stat-card-value">{total}</div>
            <div className="stat-card-sub">
              <TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> Across all batches
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-label">Positive</div>
            <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>
              {sentimentCounts.positive}
            </div>
            <div className="stat-card-sub">
              <ThumbsUp size={14} style={{ verticalAlign: 'middle' }} /> {positivePercent}% satisfaction
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-label">Neutral</div>
            <div className="stat-card-value" style={{ color: 'var(--color-neutral)' }}>
              {sentimentCounts.neutral}
            </div>
            <div className="stat-card-sub">
              <Minus size={14} style={{ verticalAlign: 'middle' }} /> Mixed feedback
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-card-label">Negative</div>
            <div className="stat-card-value" style={{ color: 'var(--color-danger)' }}>
              {sentimentCounts.negative}
            </div>
            <div className="stat-card-sub">
              <ThumbsDown size={14} style={{ verticalAlign: 'middle' }} /> Needs attention
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-grid animate-in animate-in-delay-1">
          <div className="chart-card">
            <div className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="icon primary"><PieChart size={16} /></span>
              Sentiment Distribution
            </div>
            <div style={{ maxWidth: '320px', margin: '0 auto' }}>
              <Pie data={sentimentChartData} options={sentimentChartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="icon accent"><BarChart3 size={16} /></span>
              Theme Distribution
            </div>
            <Bar data={themeChartData} options={themeChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
