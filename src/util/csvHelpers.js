export const downloadAuditCSV = (data) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  // Format time as HH-MM-SS to be filename-safe
  const timeStr = now.toLocaleTimeString().replace(/:/g, '-');
  
  const generatedAt = `Report Generated: ${now.toLocaleString()}`;
  const headers = ["Date", "Librarian", "Student ID", "Old Status", "New Status", "Remarks"];
  
  const rows = data.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.editor_name || 'System',
    log.student_id,
    log.old_status,
    log.new_status,
    `"${log.remarks || ''}"`
  ]);

  const csvContent = [generatedAt, "", headers, ...rows].map(e => Array.isArray(e) ? e.join(",") : e).join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  
  // Updated filename with date and time
  link.setAttribute("download", `audit_trail_${dateStr}_${timeStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Utility for Clearance Logs Reports (FR5)
 */
export const downloadClearanceReportCSV = (reportData) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  // Format time as HH-MM-SS to be filename-safe
  const timeStr = now.toLocaleTimeString().replace(/:/g, '-');

  const generatedAt = `Report Generated: ${now.toLocaleString()}`;
  const headers = ["Date Logged", "Student Number", "Full Name", "Program", "Purpose", "Status", "Verified By"];
  
  const rows = reportData.map(item => {
    const s = item.student || {};
    const l = item.librarian || {};
    return [
      new Date(item.data_logged).toLocaleDateString(),
      s.student_number || 'N/A',
      `"${s.first_name} ${s.last_name}"`,
      s.program || 'N/A',
      `"${s.purpose_of_clearance || ''}"`,
      item.clearance_status,
      l.first_name ? `"${l.first_name} ${l.last_name}"` : 'Pending'
    ];
  });

  const csvContent = [generatedAt, "", headers, ...rows].map(e => Array.isArray(e) ? e.join(",") : e).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  
  // Updated filename with date and time
  link.setAttribute("download", `clearance_report_${dateStr}_${timeStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};