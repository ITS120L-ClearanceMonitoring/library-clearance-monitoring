export const downloadAuditCSV = (data) => {
  const headers = ["Date", "Librarian", "Student ID", "Old Status", "New Status", "Remarks"];
  const rows = data.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.editor_name,
    log.student_id,
    log.old_status,
    log.new_status,
    `"${log.remarks || ''}"`
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "audit_trail_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};