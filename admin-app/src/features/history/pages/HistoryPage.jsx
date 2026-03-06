import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { downloadAuditCSV, downloadAuditPDF } from '../../../util/csvHelpers';
import { Button } from '../../../components/ui'; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../history.css';

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Filters, Sorting, and Timeframe
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [timeframe, setTimeframe] = useState('all'); // Timeframe state for downloads

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_trail')
          .select(`
            *,
            student:student_id(student_number)
          `)
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
  }, [sortOrder]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.student?.student_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.editor_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        log.new_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  // Handle CSV Download
  const handleDownloadCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast.info("No records to export.");
        return;
      }
      downloadAuditCSV(filteredLogs, timeframe);
      toast.success("CSV report downloaded successfully");
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = () => {
    try {
      if (filteredLogs.length === 0) {
        toast.info("No records to export.");
        return;
      }
      downloadAuditPDF(filteredLogs, timeframe);
      toast.success("PDF report downloaded successfully");
    } catch (err) {
      toast.error(`PDF Export failed: ${err.message}`);
    }
  };

  return (
    <div className="history-container" style={{ position: 'relative', minHeight: '80vh' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>History</h2>
          <p>Clearance request history and records</p>
        </div>
        <div className="export-controls">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Button onClick={handleDownloadCSV} variant="secondary" style={{ padding: '10px 20px', width: '140px' }}>CSV Report</Button>
          <Button onClick={handleDownloadPDF} variant="secondary" style={{ padding: '10px 20px', width: '140px' }}>PDF Report</Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search Student Number or Librarian..." 
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
          <option value="PENDING">Pending</option>
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
              <th>Student Number</th>
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
                  <td>{log.student?.student_number}</td>
                  <td>
                    {log.action_type === 'STUDENT_INFO_EDIT' ? (
                      <span>Student info updated</span>
                    ) : (
                      <span className={log.new_status === 'CLEARED' ? 'text-success' : 'text-error'}>
                        {log.old_status} ➜ {log.new_status}
                      </span>
                    )}
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
    </div>
  );
};

export default HistoryPage;