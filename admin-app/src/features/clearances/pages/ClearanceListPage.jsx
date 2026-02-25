import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchClearances, fetchClearanceReportData } from "../services/clearanceService";
import { downloadClearanceReportCSV, downloadClearanceReportPDF } from "../../../util/csvHelpers";
import { updateClearanceWithAudit } from "../../../services/auditService";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/supabaseClient";
import { Button, Modal } from "../../../components/ui";
import "../clearances.css";

export default function ClearanceListPage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
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
        toast.success("✅ CSV report downloaded successfully");
      } else {
        toast.info("No records to export.");
      }
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      const data = await fetchClearanceReportData();
      if (data && data.length > 0) {
        downloadClearanceReportPDF(data);
        toast.success("✅ PDF report downloaded successfully");
      } else {
        toast.info("No records to export.");
      }
    } catch (err) {
      toast.error(`PDF Export failed: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    if (newStatus === "NOT CLEARED") {
      setPendingUpdate({ item, status: newStatus });
      setShowRejectionModal(true);
      return;
    }
    
    setPendingUpdate({ item, status: newStatus });
    setShowConfirmModal(true);
  };

  const handleRejectionSubmit = () => {
    if (!rejectionRemarks.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setShowRejectionModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    
    const { item, status: newStatus } = pendingUpdate;
    const remarks = newStatus === "NOT CLEARED" ? rejectionRemarks : "";

    setShowConfirmModal(false);
    
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

      // Send email notification to student
      try {
        const student = item.student || {};
        const studentEmail = student.email;
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();

        if (studentEmail && studentName) {
          try {
            // Try using supabase.functions.invoke first
            const emailResponse = await supabase.functions.invoke('send-clearance-email', {
              body: {
                email: studentEmail,
                studentName: studentName,
                status: newStatus,
                remarks: remarks || null
              }
            });

            if (emailResponse.error) {
              console.warn('Email send warning:', emailResponse.error);
              toast.warning(`Status updated, but email could not be sent: ${emailResponse.error.message}`);
            } else {
              console.log('Email sent successfully:', emailResponse.data);
              toast.success(`✉️ Email sent to ${studentEmail}`);
            }
          } catch (invokeErr) {
            console.warn('Function invoke failed, trying direct fetch:', invokeErr);
            
            // Fallback: Try direct fetch to the function URL
            const supabaseUrl = supabase.supabaseUrl;
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(
              `${supabaseUrl}/functions/v1/send-clearance-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token || ''}`,
                },
                body: JSON.stringify({
                  email: studentEmail,
                  studentName: studentName,
                  status: newStatus,
                  remarks: remarks || null
                })
              }
            );

            const result = await response.json();
            
            if (!response.ok) {
              throw new Error(result.error || `HTTP ${response.status}`);
            }

            console.log('Email sent via direct fetch:', result);
          }
        }
      } catch (emailErr) {
        console.warn('Email service error:', emailErr);
        toast.warning(`Status updated successfully, but email could not be sent: ${emailErr.message}`);
      }

      // Show status update notification
      toast.success(`✅ Clearance marked as ${newStatus === "CLEARED" ? "APPROVED" : "REJECTED"}`);

      loadData(); // Refresh list
      setPendingUpdate(null);
      setRejectionRemarks("");
    } catch (err) { 
      toast.error(`❌ Update failed: ${err.message}`);
      setPendingUpdate(null);
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
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={true} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover
        style={{ zIndex: 9999 }}
      />
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

      {/* Rejection Remarks Modal */}
      <Modal isOpen={showRejectionModal} onClose={() => { setShowRejectionModal(false); setRejectionRemarks(""); }} title="Reason for Rejection" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
            placeholder="Enter the reason for withholding clearance..."
            style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => { setShowRejectionModal(false); setRejectionRemarks(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRejectionSubmit}
            >
              Next
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Action" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: '#333', fontSize: '16px' }}>
            Are you sure you want to {pendingUpdate?.status === "CLEARED" ? "approve" : "reject"} this clearance?
          </p>
          {pendingUpdate?.status === "NOT CLEARED" && (
            <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Reason:</strong>
              <p style={{ margin: '8px 0 0 0' }}>{rejectionRemarks}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => { 
                setShowConfirmModal(false); 
                setRejectionRemarks(""); 
                setPendingUpdate(null); 
              }}
            >
              Cancel
            </Button>
            <Button
              variant={pendingUpdate?.status === "NOT CLEARED" ? "danger" : "primary"}
              onClick={handleConfirmUpdate}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}