import React, { useEffect, useState } from "react";
import { fetchClearances, fetchClearanceReportData } from "../services/clearanceService";
import { downloadClearanceReportCSV } from "../../../util/csvHelpers";
import { updateClearanceWithAudit } from "../../../services/auditService";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui";
import "../clearances.css";

export default function ClearanceListPage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchClearances();
      setClearances(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = async () => {
    try {
      const data = await fetchClearanceReportData();
      if (data.length > 0) {
        downloadClearanceReportCSV(data);
      } else {
        alert("No records to export.");
      }
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    let remarks = "";
    if (newStatus === "NOT CLEARED") {
      remarks = prompt("Reason for withholding:");
      if (!remarks) return alert("Reason is required for rejection.");
    }
    try {
      await updateClearanceWithAudit({
        clearance_uuid: item.clearance_uuid,
        student_id: item.student_id,
        old_status: item.clearance_status,
        new_status: newStatus,
        performed_by: user?.user_id, // Uses schema user_id
        editor_name: user?.displayName || 'Librarian',
        remarks
      });
      loadData();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-6">Loading clearance records...</div>;

  return (
    <div className="clearance-container p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Clearance Requests</h2>
        <Button onClick={handleExport} variant="secondary">Export CSV Report</Button>
      </div>

      <div className="clearance-list">
        {clearances.map((item) => (
          <div key={item.clearance_uuid} className="clearance-item">
            <div className="clearance-info">
              <h4>{item.student?.first_name} {item.student?.last_name}</h4>
              <p>Student No: {item.student?.student_number}</p>
              <p>Purpose: {item.student?.purpose_of_clearance}</p>
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
        ))}
      </div>
    </div>
  );
}