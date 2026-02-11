import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { downloadAuditCSV } from '../../../util/csvHelpers';
import '../history.css';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // FR4.1: Fetch audit logs using standard React hooks (Vite-compatible)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_trail')
          .select('*')
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching history:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="history-container" style={{ position: 'relative', minHeight: '80vh' }}>
      <h2>History</h2>
      <p>Clearance request history and records</p>

      {loading ? (
        <p>Loading history records...</p>
      ) : (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th>Timestamp</th>
              <th>Librarian</th>
              <th>Student ID</th>
              <th>Change</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.audit_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.editor_name}</td>
                  <td>{log.student_id}</td>
                  <td>{log.old_status} ➜ {log.new_status}</td>
                  <td>{log.remarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>
                  No history records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* FR4.3: Export Button placed at Bottom Right */}
      <button 
        onClick={() => downloadAuditCSV(logs)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          padding: '12px 24px',
          backgroundColor: '#ffc107', // Mapúa Yellow
          color: '#000',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
      >
        Save Audit Trail (CSV)
      </button>
    </div>
  );
};

export default HistoryPage;