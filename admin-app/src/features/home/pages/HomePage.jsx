import { useEffect, useState } from 'react';
import '../home.css';
import { fetchDashboardMetrics, fetchRecentAuditActivity } from '../../clearances/services/clearanceService';

const formatFullName = (student) => {
  if (!student) return 'Unknown student';
  const parts = [student.first_name, student.middle_name, student.last_name].filter(Boolean);
  return parts.join(' ');
};

const formatTime = (isoString) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString();
};

const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const now = new Date();
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return '';

  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const HomePage = () => {
  const [metrics, setMetrics] = useState({ pending: 0, unfinished: 0, cleared: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metricsData, activityData] = await Promise.all([
          fetchDashboardMetrics(),
          fetchRecentAuditActivity(5),
        ]);

        setMetrics(metricsData);
        setActivities(activityData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Unable to load dashboard metrics and activity.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <div className="home-container">
        <div className="home-header">
          <h2>Home</h2>
          <p>Welcome to Library Clearance Monitoring System</p>
        </div>

        <div className="home-metrics-grid">
          <div className="home-metric-card">
            <h3>Pending Clearances</h3>
            <p className="metric-value">{loading ? '--' : metrics.pending}</p>
            <p className="metric-caption">Displays the number of pending clearances.</p>
          </div>
          <div className="home-metric-card">
            <h3>Unfinished Clearances</h3>
            <p className="metric-value">{loading ? '--' : metrics.unfinished}</p>
            <p className="metric-caption">Tracks students currently awaiting library clearance.</p>
          </div>
          <div className="home-metric-card">
            <h3>Cleared Clearances</h3>
            <p className="metric-value">{loading ? '--' : metrics.cleared}</p>
            <p className="metric-caption">Shows how many clearances have been completed.</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <div className="recent-activity-header">
          <h2>Recent Activity</h2>
          <p>Latest Clearance Requests and Updates</p>
        </div>

        {error && (
          <div className="recent-activity-list">
            <div className="activity-item">
              <div className="activity-main">
                <div className="activity-title-row">
                  <span className="activity-status-text">{error}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <div className="recent-activity-list">
            {loading && activities.length === 0 && (
              <div className="activity-item">
                <div className="activity-main">
                  <div className="activity-title-row">
                    <span className="activity-status-text">Loading recent activity...</span>
                  </div>
                </div>
              </div>
            )}

            {!loading && activities.length === 0 && (
              <div className="activity-item">
                <div className="activity-main">
                  <div className="activity-title-row">
                    <span className="activity-status-text">No recent activity yet.</span>
                  </div>
                </div>
              </div>
            )}

            {activities.map((entry) => {
              const studentName = formatFullName(entry.student);
              const studentNumber = entry.student?.student_number || 'Unknown';
              const when = formatTime(entry.timestamp);
              const whenAgo = formatTimeAgo(entry.timestamp);
              const statusText = entry.action_type || 'Status updated';
              const badgeText = entry.new_status || 'UPDATED';

              return (
                <div key={entry.audit_id} className="activity-item">
                  <div className="activity-main">
                    <div className="activity-title-row">
                      <span className="activity-name">{entry.editor_name || 'System'}</span>
                      <span className="activity-dot">•</span>
                      <span className="activity-status-text">{statusText.toLowerCase()}</span>
                    </div>
                    <div className="activity-secondary">
                      <span className="activity-student">
                        {studentName} #{studentNumber}
                      </span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-timestamp">{when}</span>
                      {whenAgo && (
                        <>
                          <span className="activity-dot">•</span>
                          <span className="activity-relative">{whenAgo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="activity-badge">{badgeText}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
