import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const filterByTimeframe = (data, dateField, timeframe) => {
  if (!timeframe || timeframe === 'all') return data;

  const now = new Date();
  const startOfPeriod = new Date();

  if (timeframe === 'week') {
    startOfPeriod.setDate(now.getDate() - 7);
  } else if (timeframe === 'month') {
    startOfPeriod.setMonth(now.getMonth() - 1);
  } else if (timeframe === 'year') {
    startOfPeriod.setFullYear(now.getFullYear() - 1);
  }

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startOfPeriod && itemDate <= now;
  });
};

const getTimestampedFilename = (prefix, timeframe = 'all') => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString().replace(/:/g, '-').replace(/\s/g, '');
  const timeframeSuffix = timeframe !== 'all' ? `_last_${timeframe}` : '';
  return `${prefix}${timeframeSuffix}_${dateStr}_${timeStr}`;
};

const generateSummaryData = (filteredData) => {
  const summary = {};
  
  filteredData.forEach(item => {
    const programName = item.student?.program?.program_name || 'N/A';
    
    if (!summary[programName]) {
      summary[programName] = { cleared: 0, rejected: 0 };
    }
    
    if (item.clearance_status === 'CLEARED') {
      summary[programName].cleared++;
    } else if (item.clearance_status === 'NOT CLEARED' || item.clearance_status === 'REJECTED') {
      summary[programName].rejected++;
    }
  });

  return Object.keys(summary)
    .sort((a, b) => a.localeCompare(b))
    .map(program => [
      program,
      summary[program].cleared,
      summary[program].rejected
    ]);
};

export const downloadAuditCSV = (data, timeframe = 'all') => {
  const filteredData = filterByTimeframe(data, 'timestamp', timeframe);
  if (filteredData.length === 0) throw new Error("No data available for the selected timeframe.");

  const generatedAt = `Report Generated: ${new Date().toLocaleString()} (Filter: ${timeframe})`;
  const headers = ["Date", "Librarian", "Student Number", "Old Status", "New Status", "Remarks"];
  
  const rows = filteredData.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.editor_name || 'System',
    log.student?.student_number || log.student_id,
    log.old_status,
    log.new_status,
    `"${(log.remarks || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [generatedAt, "", headers, ...rows]
    .map(e => Array.isArray(e) ? e.join(",") : e)
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${getTimestampedFilename("audit_trail", timeframe)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAuditPDF = (data, timeframe = 'all') => {
  const filteredData = filterByTimeframe(data, 'timestamp', timeframe);
  if (filteredData.length === 0) throw new Error("No data available for the selected timeframe.");

  const doc = new jsPDF();
  const generatedAt = `Report Generated: ${new Date().toLocaleString()} (Filter: ${timeframe})`;
  
  doc.setFontSize(16);
  doc.text("Audit Trail Report", 14, 15);
  doc.setFontSize(10);
  doc.text(generatedAt, 14, 22);

  const headers = [["Date", "Librarian", "Student Number", "Old Status", "New Status", "Remarks"]];
  const rows = filteredData.map(log => {
    const safeRemarks = (log.remarks || '').replace(/→/g, '->');
    return [
      new Date(log.timestamp).toLocaleString(),
      log.editor_name || 'System',
      log.student?.student_number || log.student_id,
      log.old_status,
      log.new_status,
      safeRemarks
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: headers,
    body: rows,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [58, 134, 255] }
  });

  doc.save(`${getTimestampedFilename("audit_trail", timeframe)}.pdf`);
};

export const downloadClearanceReportCSV = (reportData, timeframe = 'all') => {
  const filteredData = filterByTimeframe(reportData, 'data_logged', timeframe);
  if (filteredData.length === 0) throw new Error("No data available for the selected timeframe.");

  const generatedAt = `Report Generated: ${new Date().toLocaleString()} (Filter: ${timeframe})`;
  
  const summaryRows = generateSummaryData(filteredData);
  const summarySection = [
    ["Summary by Program"],
    ["Program", "Amount Cleared", "Amount Rejected"],
    ...summaryRows.map(row => [`"${row[0]}"`, row[1], row[2]]),
    []
  ];

  const headers = ["Date Logged", "Student Number", "Full Name", "Program", "Purpose", "Status", "Verified By"];
  const rows = filteredData.map(item => {
    const s = item.student || {};
    const l = item.librarian || {};
    
    const programName = s.program?.program_name || 'N/A';
    const purposeName = s.purpose?.purpose_name || 'N/A';

    return [
      new Date(item.data_logged).toLocaleDateString(),
      s.student_number || 'N/A',
      `"${s.first_name} ${s.last_name}"`,
      `"${programName}"`,
      `"${purposeName}"`,
      item.clearance_status,
      l.first_name ? `"${l.first_name} ${l.last_name}"` : 'Pending'
    ];
  });

  const csvContent = [
    generatedAt, 
    "", 
    ...summarySection,
    ["Detailed Clearance Report"],
    headers, 
    ...rows
  ]
    .map(e => Array.isArray(e) ? e.join(",") : e)
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${getTimestampedFilename("clearance_report", timeframe)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadClearanceReportPDF = (reportData, timeframe = 'all') => {
  const filteredData = filterByTimeframe(reportData, 'data_logged', timeframe);
  if (filteredData.length === 0) throw new Error("No data available for the selected timeframe.");

  const doc = new jsPDF();
  const generatedAt = `Report Generated: ${new Date().toLocaleString()} (Filter: ${timeframe})`;
  
  doc.setFontSize(16);
  doc.text("Clearance Report", 14, 15);
  doc.setFontSize(10);
  doc.text(generatedAt, 14, 22);

  const summaryRows = generateSummaryData(filteredData);
  
  doc.setFontSize(12);
  doc.text("Summary by Program", 14, 32);

  autoTable(doc, {
    startY: 36,
    head: [["Program", "Amount Cleared", "Amount Rejected"]],
    body: summaryRows,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      overflow: 'linebreak' 
    },
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [58, 134, 255] }
  });

  const finalY = doc.lastAutoTable.finalY || 36;

  doc.setFontSize(12);
  doc.text("Detailed Clearance Report", 14, finalY + 10);

  const headers = [["Date Logged", "Student Number", "Full Name", "Program", "Purpose", "Status", "Verified By"]];
  const rows = filteredData.map(item => {
    const s = item.student || {};
    const l = item.librarian || {};
    
    const programName = s.program?.program_name || 'N/A';
    const purposeName = s.purpose?.purpose_name || 'N/A';

    return [
      new Date(item.data_logged).toLocaleDateString(),
      s.student_number || 'N/A',
      `${s.first_name} ${s.last_name}`,
      programName,
      purposeName,
      item.clearance_status,
      l.first_name ? `${l.first_name} ${l.last_name}` : 'Pending'
    ];
  });

  autoTable(doc, {
    startY: finalY + 14,
    head: headers,
    body: rows,
    theme: 'striped',
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 },
    headStyles: { fillColor: [255, 199, 44], textColor: [0, 0, 0] } 
  });

  doc.save(`${getTimestampedFilename("clearance_report", timeframe)}.pdf`);
};