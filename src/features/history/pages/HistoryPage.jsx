import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { downloadAuditCSV, downloadAuditPDF } from '../../../util/csvHelpers';
import { Button } from '../../../components/ui'; // Use your existing Button component
import '../history.css';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New State for Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_trail')
          .select('*')
          .order('timestamp', { ascending: sortOrder === 'asc' });
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching history:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [sortOrder]); // Re-fetch when sort order changes

  // Logic for Search and Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.editor_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        log.new_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  return (
    <div className="history-container" style={{ position: 'relative', minHeight: '80vh' }}>
      <h2>History</h2>
      <p>Clearance request history and records</p>

      {/* Filter Controls */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search Student ID or Librarian..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '2', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: '1', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          <option value="all">All Statuses</option>
          <option value="CLEARED">Cleared</option>
          <option value="NOT CLEARED">Not Cleared</option>
        </select>

        <Button 
          variant="ghost" 
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
        >
          Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>

      {loading ? (
        <p>Loading history records...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.audit_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.editor_name}</td>
                  <td>{log.student_id}</td>
                  <td>
                    <span className={log.new_status === 'CLEARED' ? 'text-success' : 'text-error'}>
                      {log.old_status} ➜ {log.new_status}
                    </span>
                  </td>
                  <td>{log.remarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>
                  No records match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Export Floating Action Buttons */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', gap: '10px', zIndex: 1000 }}>
        <button onClick={() => downloadAuditCSV(filteredLogs)} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Save CSV
        </button>
        <button onClick={() => downloadAuditPDF(filteredLogs)} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Save PDF
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;