import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CourtCase } from '../types.js';
import { toDisplayDate } from './date.js';

export interface ExportOptions {
  title: string;
  subtitle?: string;
  courtName?: string;
  filterDescription?: string;
  generatedBy?: string;
}

export function exportToExcel(cases: CourtCase[], options: ExportOptions): void {
  const data = cases.map((c) => ({
    'Serial No.': c.SerialNo,
    'Case Date': toDisplayDate(c.CaseDate),
    'Case Number': c.CaseNumber,
    'Result': c.Result,
    'Dairy Date': toDisplayDate(c.DairyDate),
    'Description': c.Description || '',
    'Remarks': c.Remarks || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Serial No
    { wch: 14 }, // Case Date
    { wch: 22 }, // Case Number
    { wch: 16 }, // Result
    { wch: 14 }, // Dairy Date
    { wch: 35 }, // Description
    { wch: 30 }, // Remarks
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Court Dairy Cases');

  const todayStr = new Date().toISOString().split('T')[0];
  const cleanTitle = (options.title || 'CourtDairy').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${cleanTitle}_${todayStr}.xlsx`);
}

export function exportToCsv(cases: CourtCase[], filename: string = 'CourtDairy_Report.csv'): void {
  const headers = ['Serial No.', 'Case Date', 'Case Number', 'Result', 'Dairy Date', 'Description', 'Remarks'];
  
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = cases.map(c => [
    c.SerialNo,
    toDisplayDate(c.CaseDate),
    escapeCsv(c.CaseNumber),
    escapeCsv(c.Result),
    toDisplayDate(c.DairyDate),
    escapeCsv(c.Description),
    escapeCsv(c.Remarks)
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToWord(cases: CourtCase[], options: ExportOptions): void {
  const todayStr = new Date().toISOString().split('T')[0];
  const tableRows = cases.map(c => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${c.SerialNo}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${toDisplayDate(c.CaseDate)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${c.CaseNumber}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${c.Result}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${toDisplayDate(c.DairyDate)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px;">${c.Description || '-'}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px;">${c.Remarks || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${options.title}</title>
      <style>
        body { font-family: 'Calibri', 'Times New Roman', serif; margin: 20px; font-size: 11pt; color: #0f172a; }
        h1 { text-align: center; margin: 0; font-size: 18pt; text-transform: uppercase; color: #0f172a; }
        h2 { text-align: center; margin: 4px 0 16px 0; font-size: 12pt; font-weight: normal; color: #475569; }
        .meta { margin-bottom: 16px; font-size: 10pt; color: #475569; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; }
        .footer { margin-top: 24px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 8px; }
      </style>
    </head>
    <body>
      <h1>${options.courtName || 'Court of Judicial Magistrate'}</h1>
      <h2>${options.title} ${options.subtitle ? ' — ' + options.subtitle : ''}</h2>
      <div class="meta">
        <div><strong>Report Filter:</strong> ${options.filterDescription || 'All Records'}</div>
        <div><strong>Total Cases:</strong> ${cases.length} | <strong>Generated On:</strong> ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</div>
        ${options.generatedBy ? `<div><strong>Officer:</strong> ${options.generatedBy}</div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Serial</th>
            <th style="width: 12%;">Case Date</th>
            <th style="width: 18%;">Case Number</th>
            <th style="width: 12%;">Result</th>
            <th style="width: 12%;">Dairy Date</th>
            <th style="width: 20%;">Description</th>
            <th style="width: 18%;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        Generated by Court Dairy — Court Case Diary & Management System
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanTitle = (options.title || 'CourtDairy_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${cleanTitle}_${todayStr}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPdf(cases: CourtCase[], options: ExportOptions): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(options.courtName || 'COURT OF JUDICIAL MAGISTRATE & BENCH OFFICER', 148, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(options.title || 'COURT CASE DIARY REPORT', 148, 20, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100);
  const metaText = `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()} | Total Cases: ${cases.length} | Filter: ${options.filterDescription || 'All Records'}`;
  doc.text(metaText, 14, 26);

  const tableBody = cases.map(c => [
    String(c.SerialNo),
    toDisplayDate(c.CaseDate),
    c.CaseNumber,
    c.Result,
    toDisplayDate(c.DairyDate),
    c.Description || '-',
    c.Remarks || '-'
  ]);

  autoTable(doc, {
    startY: 29,
    head: [['Serial No.', 'Case Date', 'Case Number', 'Result', 'Dairy Date', 'Description', 'Remarks']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 75 },
      6: { cellWidth: 65 }
    },
    didDrawPage: (data) => {
      // Footer
      const pageStr = `Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(pageStr, 280, 204, { align: 'right' });
      doc.text('Court Dairy — Court Case Diary & Management System', 14, 204);
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const cleanTitle = (options.title || 'CourtDairy_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}_${todayStr}.pdf`);
}
