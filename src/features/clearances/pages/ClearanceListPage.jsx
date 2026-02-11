import React, { useEffect, useState } from "react";
import { fetchClearances } from "../services/clearanceService";
import { updateClearanceWithAudit } from "../../../services/auditService"; // Import your Audit Service
import { useAuth } from "../../../context/AuthContext"; // To get the Librarian's name (FR3.4)
import "../clearances.css";

const getStatusClass = (status) => {
  if (!status) return "status-pending";
  switch (status.toUpperCase()) {
    case "CLEARED": return "status-approved";
    case "NOT CLEARED": return "status-rejected";
    default: return "status-pending";
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

export default function ClearanceListPage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // FR3.4: Librarian ID/Name

  const loadClearances = async () => {
    try {
      setLoading(true);
      const data = await fetchClearances();
      setClearances(data);
    } catch (err) {
      setError(err.message || "Failed to load clearance requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClearances();
  }, []);

  // Handler for Approve/Reject Actions
  const handleStatusUpdate = async (item, newStatus) => {
    let remarks = "";

    // FR3.3: Mandatory Reason for Denial
    if (newStatus === "NOT CLEARED") {
      remarks = prompt("Please provide a Reason for Withholding (e.g., Unpaid fine, Unreturned book):");
      if (!remarks) return alert("You must provide a reason to mark a student as 'Not Cleared'.");
    }

    try {
      await updateClearanceWithAudit({
        clearance_uuid: item.clearance_uuid,
        student_id: item.student_id,
        old_status: item.clearance_status,
        new_status: newStatus,
        performed_by: user?.id || 'DEBUG_ID',
        editor_name: user?.displayName || 'Librarian',
        remarks: remarks
      });
      
      alert(`Status successfully updated to ${newStatus}`);
      loadClearances(); // Refresh the list
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <div className="clearance-container">
      <h2>Clearance Requests</h2>
      {/* ... keep your existing loading and error states ... */}

      {!loading && !error && clearances.map((item) => {
        const student = item.student || {};
        const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
        const statusClass = getStatusClass(item.clearance_status);

        return (
          <div key={item.clearance_id || item.clearance_uuid} className="clearance-item">
            <div className="clearance-info">
              <h4>{fullName || "Unnamed student"}</h4>
              <p>Student No.: {student.student_number || "—"}</p>
              <p>Purpose: {student.purpose_of_clearance || "—"}</p>
              <p>Logged at: {formatDateTime(item.data_logged)}</p>
            </div>
            
            <div className="clearance-actions">
              <span className={`status-badge ${statusClass}`}>
                {item.clearance_status || "UNKNOWN"}
              </span>
              
              {/* FR3.2: Status Controls */}
              <div className="button-group" style={{ marginTop: '10px' }}>
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
          </div>
        );
      })}
    </div>
  );
}