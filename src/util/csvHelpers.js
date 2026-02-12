import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const getTimestampedFilename = (prefix) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString().replace(/:/g, '-').replace(/\s/g, '');
  return `${prefix}_${dateStr}_${timeStr}`;
};

export const downloadAuditCSV = (data) => {
  const generatedAt = `Report Generated: ${new Date().toLocaleString()}`;
  const headers = ["Date", "Librarian", "Student ID", "Old Status", "New Status", "Remarks"];
  
  const rows = data.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.editor_name || 'System',
    log.student_id,
    log.old_status,
    log.new_status,
    `"${log.remarks || ''}"`
  ]);

  const csvContent = [generatedAt, "", headers, ...rows]
    .map(e => Array.isArray(e) ? e.join(",") : e)
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${getTimestampedFilename("audit_trail")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAuditPDF = (data) => {
  const doc = new jsPDF();
  const generatedAt = `Report Generated: ${new Date().toLocaleString()}`;
  
  doc.setFontSize(16);
  doc.text("Audit Trail Report", 14, 15);
  doc.setFontSize(10);
  doc.text(generatedAt, 14, 22);

  const headers = [["Date", "Librarian", "Student ID", "Old Status", "New Status", "Remarks"]];
  const rows = data.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.editor_name || 'System',
    log.student_id,
    log.old_status,
    log.new_status,
    log.remarks || ''
  ]);

  // FIX: Use functional usage instead of doc.autoTable
  autoTable(doc, {
    startY: 30,
    head: headers,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [227, 27, 35] } // Mapua Red
  });

  doc.save(`${getTimestampedFilename("audit_trail")}.pdf`);
};

export const downloadClearanceReportCSV = (reportData) => {
  const generatedAt = `Report Generated: ${new Date().toLocaleString()}`;
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

  const csvContent = [generatedAt, "", headers, ...rows]
    .map(e => Array.isArray(e) ? e.join(",") : e)
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${getTimestampedFilename("clearance_report")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadClearanceReportPDF = (reportData) => {
  const doc = new jsPDF();
  const generatedAt = `Report Generated: ${new Date().toLocaleString()}`;
  
  doc.setFontSize(16);
  doc.text("Clearance Report", 14, 15);
  doc.setFontSize(10);
  doc.text(generatedAt, 14, 22);

  const headers = [["Date Logged", "Student Number", "Full Name", "Program", "Purpose", "Status", "Verified By"]];
  const rows = reportData.map(item => {
    const s = item.student || {};
    const l = item.librarian || {};
    return [
      new Date(item.data_logged).toLocaleDateString(),
      s.student_number || 'N/A',
      `${s.first_name} ${s.last_name}`,
      s.program || 'N/A',
      item.purpose_of_clearance || '',
      item.clearance_status,
      l.first_name ? `${l.first_name} ${l.last_name}` : 'Pending'
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: headers,
    body: rows,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 199, 44], textColor: [0, 0, 0] } 
  });

  doc.save(`${getTimestampedFilename("clearance_report")}.pdf`);
};