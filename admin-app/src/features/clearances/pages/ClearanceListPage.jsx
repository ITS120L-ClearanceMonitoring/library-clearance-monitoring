import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchClearances, fetchClearanceReportData } from "../services/clearanceService";
import { downloadClearanceReportCSV, downloadClearanceReportPDF } from "../../../util/csvHelpers";
import { updateClearanceWithAudit, updateStudentInfoWithAudit } from "../../../services/auditService";
import { useAuth } from "../../../context/AuthContext";
import { Button, Modal } from "../../../components/ui";
import "../clearances.css";

export default function ClearanceListPage() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeframe, setTimeframe] = useState("all"); // Added state for timeframe
  const [activeTab, setActiveTab] = useState("active"); // "active" or "completed"
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editStudentNumber, setEditStudentNumber] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { user } = useAuth();

  const currentEditorName = user?.first_name && user?.last_name
    ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}`.trim()
    : user?.email || 'Librarian';

  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await fetchClearances();
      setClearances(data);
    } catch (err) { 
      console.error("Failed to load clearances:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(true); }, []);

  const handleExportCSV = async () => {
    try {
      const data = await fetchClearanceReportData();
      if (data && data.length > 0) {
        downloadClearanceReportCSV(data, timeframe); // Passed timeframe
        toast.success("CSV report downloaded successfully");
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
        downloadClearanceReportPDF(data, timeframe); 
        toast.success("PDF report downloaded successfully");
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
      await updateClearanceWithAudit({
        clearance_uuid: item.clearance_uuid,
        student_id: item.student_id,
        old_status: item.clearance_status,
        new_status: newStatus,
        performed_by: user?.user_id,
        editor_name: currentEditorName,
        remarks,
        last_fetched_at: item.last_updated_at
      });

      const statusText = newStatus === "CLEARED" ? "APPROVED" : "REJECTED";
      
      // Send email notification to student (don't await - fire and forget)
      const student = item.student || {};
      const studentName = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.replace(/\s+/g, ' ').trim();
      const studentEmail = student.email;

      if (studentEmail) {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-clearance-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              email: studentEmail,
              studentName: studentName || 'Student',
              status: newStatus,
              remarks: remarks
            })
          }
        ).then(res => res.json())
         .then(result => console.log('Email sent:', result))
         .catch(err => console.error('Email failed:', err));
        
        toast.success(`Clearance ${statusText}. Email notification sent to ${studentEmail}`);
      } else {
        toast.success(`Clearance ${statusText}. No email on file for student.`);
      }

      loadData();
      setPendingUpdate(null);
      setRejectionRemarks("");
    } catch (err) { 
      toast.error(`Update failed: ${err.message}`);
      setPendingUpdate(null);
    }
  };

  const handleOpenEditModal = (item) => {
    const student = item.student || {};
    setSelectedEntry(item);
    setEditFirstName(student.first_name || "");
    setEditLastName(student.last_name || "");
    setEditStudentNumber(student.student_number || "");
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEntry(null);
    setEditFirstName("");
    setEditLastName("");
    setEditStudentNumber("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry?.student?.student_id) {
      toast.error("Unable to edit this entry. Missing student record.");
      return;
    }

    const trimmedFirstName = editFirstName.trim();
    const trimmedLastName = editLastName.trim();
    const trimmedStudentNumber = editStudentNumber.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedStudentNumber) {
      toast.error("First name, last name, and student number are required.");
      return;
    }

    const oldStudent = selectedEntry.student;
    const hasChanges =
      (oldStudent.first_name || "") !== trimmedFirstName ||
      (oldStudent.last_name || "") !== trimmedLastName ||
      (oldStudent.student_number || "") !== trimmedStudentNumber;

    if (!hasChanges) {
      toast.info("No changes detected.");
      handleCloseEditModal();
      return;
    }

    try {
      setSavingEdit(true);
      await updateStudentInfoWithAudit({
        student_id: oldStudent.student_id,
        old_first_name: oldStudent.first_name || "",
        old_last_name: oldStudent.last_name || "",
        old_student_number: oldStudent.student_number || "",
        new_first_name: trimmedFirstName,
        new_last_name: trimmedLastName,
        new_student_number: trimmedStudentNumber,
        performed_by: user?.user_id,
        editor_name: currentEditorName,
        clearance_uuid: selectedEntry.clearance_uuid,
        clearance_status: selectedEntry.clearance_status
      });

      toast.success("Entry updated successfully.");
      handleCloseEditModal();
      loadData();
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredClearances = clearances.filter((item) => {
    const student = item.student || {};
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
    const studentNo = (student.student_number || "").toLowerCase();
    const search = searchQuery.toLowerCase();

    const matchesSearch = fullName.includes(search) || studentNo.includes(search);
    
    // Tab-based filtering
    let matchesTab = true;
    if (activeTab === "active") {
      matchesTab = item.clearance_status === "PENDING";
    } else if (activeTab === "completed") {
      matchesTab = item.clearance_status === "CLEARED" || item.clearance_status === "NOT CLEARED";
    }

    // Status filter only applies in completed tab
    const matchesStatus = activeTab === "active" ? true : (statusFilter === "all" || item.clearance_status === statusFilter);

    return matchesSearch && matchesTab && matchesStatus;
  });

  if (loading) return (
    <>
      <div className="p-6">Loading clearances...</div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="clearance-container p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Clearance Requests</h2>
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
            <Button onClick={handleExportCSV} variant="secondary" style={{ padding: '10px 20px', width: '140px' }}>CSV Report</Button>
            <Button onClick={handleExportPDF} variant="secondary" style={{ padding: '10px 20px', width: '140px' }}>PDF Report</Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
          <button
            onClick={() => { setActiveTab('active'); setStatusFilter('all'); setSearchQuery(''); }}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'active' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              color: activeTab === 'active' ? 'var(--primary)' : '#999',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
          >
            Active Requests ({clearances.filter(c => c.clearance_status === 'PENDING').length})
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setStatusFilter('all'); setSearchQuery(''); }}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'completed' ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              color: activeTab === 'completed' ? 'var(--primary)' : '#999',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
          >
            Completed ({clearances.filter(c => c.clearance_status === 'CLEARED' || c.clearance_status === 'NOT CLEARED').length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
          <input 
            type="text" 
            placeholder="Search name or student number..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} 
          />
          {activeTab === 'completed' && (
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="all">All Statuses</option>
              <option value="CLEARED">Cleared</option>
              <option value="NOT CLEARED">Not Cleared</option>
            </select>
          )}
        </div>

        <div className="clearance-list">
        {filteredClearances.map((item) => {
          const student = item.student || {};
          const purposeName = student.purpose?.purpose_name || 'N/A';
          const isCompleted = activeTab === 'completed';
          return (
            <div key={item.clearance_uuid} className="clearance-item" onClick={() => handleOpenEditModal(item)}>
              <div className="clearance-info">
                <h4>{student.first_name} {student.last_name}</h4>
                <p>Student No: {student.student_number}</p>
                <p>Purpose: {purposeName}</p>
                <p>Status: <strong>{item.clearance_status}</strong></p>
              </div>
              <div className="button-group">
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item, "CLEARED"); }} 
                    className="btn-approve" 
                    disabled={item.clearance_status === "CLEARED" || isCompleted}
                 >
                   Approve
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item, "NOT CLEARED"); }} 
                    className="btn-reject"
                    disabled={isCompleted}
                 >
                   Reject
                 </button>
              </div>
            </div>
          );
        })}
        {filteredClearances.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
            <p>{activeTab === 'active' ? 'No pending clearance requests' : 'No completed clearances'}</p>
          </div>
        )}
        </div>
      </div>

      <Modal isOpen={showRejectionModal} onClose={() => { setShowRejectionModal(false); setRejectionRemarks(""); }} title="Reason for Rejection" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
            placeholder="Enter the reason for withholding clearance..."
            style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => { setShowRejectionModal(false); setRejectionRemarks(""); }}>Cancel</Button>
            <Button variant="primary" onClick={handleRejectionSubmit}>Next</Button>
          </div>
        </div>
      </Modal>

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
            <Button variant="ghost" onClick={() => { setShowConfirmModal(false); setRejectionRemarks(""); setPendingUpdate(null); }}>Cancel</Button>
            <Button variant={pendingUpdate?.status === "NOT CLEARED" ? "danger" : "primary"} onClick={handleConfirmUpdate}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Clearance Entry" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>First Name</label>
            <input
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>Last Name</label>
            <input
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>Student Number</label>
            <input
              type="text"
              value={editStudentNumber}
              onChange={(e) => setEditStudentNumber(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" onClick={handleCloseEditModal} disabled={savingEdit}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}