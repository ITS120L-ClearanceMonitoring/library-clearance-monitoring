import React, { useEffect, useState } from "react";
import { fetchClearances, fetchClearanceReportData } from "../services/clearanceService";
import { downloadClearanceReportCSV, downloadClearanceReportPDF } from "../../../util/csvHelpers";
import { updateClearanceWithAudit } from "../../../services/auditService";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui";
import "../clearances.css";

export default function ClearanceListPage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchClearances();
      setClearances(data);
    } catch (err) { 
      console.error("Failed to load clearances:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleExportCSV = async () => {
    try {
      const data = await fetchClearanceReportData();
      if (data && data.length > 0) {
        downloadClearanceReportCSV(data);
      } else {
        alert("No records to export.");
      }
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const data = await fetchClearanceReportData();
      if (data && data.length > 0) {
        downloadClearanceReportPDF(data);
      } else {
        alert("No records to export.");
      }
    } catch (err) {
      alert("PDF Export failed: " + err.message);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    let remarks = "";
    if (newStatus === "NOT CLEARED") {
      remarks = prompt("Reason for withholding:");
      if (!remarks) return alert("Reason is required for rejection.");
    }
    
    try {
      // FR5.2: Pass last_updated_at to implement optimistic concurrency control
      await updateClearanceWithAudit({
        clearance_uuid: item.clearance_uuid,
        student_id: item.student_id,
        old_status: item.clearance_status,
        new_status: newStatus,
        performed_by: user?.user_id, // Uses correct schema field
        editor_name: user?.first_name && user?.last_name ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}`.trim() : user?.email || 'Librarian',
        remarks,
        last_fetched_at: item.last_updated_at // Added for conflict resolution
      });
      loadData(); // Refresh list
    } catch (err) { 
      alert("Update failed: " + err.message); 
    }
  };

  const filteredClearances = clearances.filter((item) => {
    const student = item.student || {};
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
    const studentNo = (student.student_number || "").toLowerCase();
    const search = searchQuery.toLowerCase();

    const matchesSearch = fullName.includes(search) || studentNo.includes(search);
    const matchesStatus = statusFilter === "all" || item.clearance_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-6">Loading clearances...</div>;

  return (
    <div className="clearance-container p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Clearance Requests</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleExportCSV} variant="secondary">CSV Report</Button>
          <Button onClick={handleExportPDF} variant="secondary">PDF Report</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input 
          type="text" 
          placeholder="Search name or student number..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} 
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
        >
          <option value="all">All Statuses</option>
          <option value="CLEARED">Cleared</option>
          <option value="NOT CLEARED">Not Cleared</option>
        </select>
      </div>

      <div className="clearance-list">
        {filteredClearances.map((item) => {
          const student = item.student || {};
          return (
            <div key={item.clearance_uuid} className="clearance-item">
              <div className="clearance-info">
                <h4>{student.first_name} {student.last_name}</h4>
                <p>Student No: {student.student_number}</p>
                <p>Purpose: {student.purpose_of_clearance}</p>
                <p>Status: <strong>{item.clearance_status}</strong></p>
              </div>
              <div className="button-group">
                 <button 
                    onClick={() => handleStatusUpdate(item, "CLEARED")} 
                    className="btn-approve" 
                    disabled={item.clearance_status === "CLEARED"}
                 >
                   Approve
                 </button>
                 <button 
                    onClick={() => handleStatusUpdate(item, "NOT CLEARED")} 
                    className="btn-reject" 
                    disabled={item.clearance_status === "NOT CLEARED"}
                 >
                   Reject
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}