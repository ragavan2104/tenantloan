import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PendingDue {
  id: string;
  name: string;
  phone: string;
  branch_name?: string;
  next_due_date: string;
  emi_amount: number;
  outstanding_amount: number;
  status: string;
}

interface Summary {
  total_pending: number;
  total_overdue: number;
  count_pending: number;
  count_overdue: number;
  total_count: number;
}

interface ReportData {
  borrowers: PendingDue[];
  summary: Summary;
  companyName: string;
  reportType: string;
  filters?: {
    status?: string;
    branch?: string;
    dateRange?: string;
  };
}

interface Payment {
  id: string;
  borrower_name: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_mode: string;
  collected_by_name: string;
  whatsapp_sent?: boolean;
  branch_name?: string;
  loan_number?: number;
}

interface PaymentReportData {
  payments: Payment[];
  companyName: string;
  totalAmount: number;
  filters?: {
    paymentType?: string;
    paymentMode?: string;
    branch?: string;
    dateRange?: string;
  };
}

export const generatePendingDuesPDF = (data: ReportData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Professional Color Palette
  const primaryColor: [number, number, number] = [41, 128, 185]; // Corporate Blue
  const warningColor: [number, number, number] = [245, 127, 23]; // Dark Amber/Orange for readability
  const textColor: [number, number, number] = [44, 62, 80];      // Dark Slate

  const marginX = 15;
  let yPosition = 20;
  
  // ============================================================================
  // HEADER SECTION (Left & Right Split Layout)
  // ============================================================================
  
  // Left Side: Company Name & Report Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(data.companyName, marginX, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 130, 140);
  doc.text('PENDING DUES REPORT', marginX, yPosition);

  // Right Side: Meta Data (Date, Type, Filters)
  let rightY = 18;
  const rightX = pageWidth - marginX;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated on: ${reportDate}`, rightX, rightY, { align: 'right' });
  rightY += 5;

  if (data.reportType) {
    doc.text(`Report Type: ${data.reportType}`, rightX, rightY, { align: 'right' });
    rightY += 5;
  }

  if (data.filters) {
    const filterTexts: string[] = [];
    if (data.filters.status && data.filters.status !== 'all') filterTexts.push(`Status: ${data.filters.status}`);
    if (data.filters.branch) filterTexts.push(`Branch: ${data.filters.branch}`);
    if (data.filters.dateRange) filterTexts.push(`Date Range: ${data.filters.dateRange}`);
    
    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(' | ')}`, rightX, rightY, { align: 'right' });
    }
  }
  
  // Horizontal Separator Line
  yPosition = Math.max(yPosition, rightY) + 8;
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.5);
  doc.line(marginX, yPosition, pageWidth - marginX, yPosition);
  yPosition += 10;
  
  // ============================================================================
  // SUMMARY SECTION (Cards Layout)
  // ============================================================================
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('SUMMARY DASHBOARD', marginX, yPosition);
  yPosition += 6;
  
  // Dynamic calculation for evenly spaced summary boxes
  const gap = 5;
  const numberOfBoxes = 4;
  const totalGapSpace = gap * (numberOfBoxes - 1);
  const boxWidth = (pageWidth - (marginX * 2) - totalGapSpace) / numberOfBoxes;
  const boxHeight = 26; // Height increased slightly for perfect vertical distribution
  const boxY = yPosition;
  const centerXOffset = boxWidth / 2;
  
  let currentX = marginX;

  // Box 1: Total Pending
  doc.setFillColor(255, 248, 225); // Light Yellow
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(0.2);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Total Pending', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...warningColor);
  doc.text(`Rs. ${data.summary.total_pending.toLocaleString('en-IN')}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.summary.count_pending} borrowers`, currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  // Box 2: Total Overdue
  currentX += boxWidth + gap;
  doc.setFillColor(253, 237, 237); // Light Red
  doc.setDrawColor(220, 53, 69);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Total Overdue', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47); // Darker Red for contrast
  doc.text(`Rs. ${data.summary.total_overdue.toLocaleString('en-IN')}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.summary.count_overdue} borrowers`, currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  // Box 3: Combined Total
  currentX += boxWidth + gap;
  doc.setFillColor(240, 247, 255); // Light Blue
  doc.setDrawColor(...primaryColor);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Combined Total', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`Rs. ${(data.summary.total_pending + data.summary.total_overdue).toLocaleString('en-IN')}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.summary.total_count} borrowers`, currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  // Box 4: Total Borrowers
  currentX += boxWidth + gap;
  doc.setFillColor(248, 249, 250); // Light Grey
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Total Borrowers', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(`${data.summary.total_count}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('with pending dues', currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  yPosition = boxY + boxHeight + 12;
  
  // ============================================================================
  // TABLE SECTION
  // ============================================================================
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('BORROWER DETAILS', marginX, yPosition);
  yPosition += 5;
  
  const tableData = data.borrowers.map((borrower, index) => {
    const dueDate = new Date(borrower.next_due_date);
    const formattedDate = dueDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    
    return [
      (index + 1).toString(),
      borrower.name,
      borrower.phone,
      borrower.branch_name || 'N/A',
      formattedDate,
      `Rs. ${borrower.emi_amount.toLocaleString('en-IN')}`,
      `Rs. ${borrower.outstanding_amount.toLocaleString('en-IN')}`,
      borrower.status === 'overdue' ? 'Overdue' : 'Pending',
    ];
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Borrower Name', 'Phone', 'Branch', 'Due Date', 'EMI Amount', 'Outstanding', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [230, 235, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      // Removed global 'halign: center' so headers map correctly to column alignment
      valign: 'middle'
    },
    bodyStyles: {
      textColor: textColor,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'left', cellWidth: 30 },
      3: { halign: 'left', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 35 },
      6: { halign: 'right', cellWidth: 40 },
      7: { halign: 'center', cellWidth: 30 },
    },
    didParseCell: (data) => {
      // Enhanced Status Pill-like Colors
      if (data.column.index === 7 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Overdue') {
          data.cell.styles.fillColor = [253, 237, 237];
          data.cell.styles.textColor = [211, 47, 47];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.fillColor = [255, 248, 225];
          data.cell.styles.textColor = [245, 127, 23];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: marginX, right: marginX },
    alternateRowStyles: {
      fillColor: [249, 250, 252], 
    },
  });
  
  // ============================================================================
  // FOOTER
  // ============================================================================
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${data.companyName} - Pending Dues Report`,
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: 'right' }
    );
  }
  
  // Save PDF
  const filename = `Pending_Dues_${new Date().getTime()}.pdf`;
  doc.save(filename);
};

export const generatePaymentsPDF = (data: PaymentReportData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Professional Color Palette
  const primaryColor: [number, number, number] = [41, 128, 185]; // Corporate Blue
  const successColor: [number, number, number] = [40, 167, 69];  // Green
  const textColor: [number, number, number] = [44, 62, 80];      // Dark Slate

  const marginX = 15;
  let yPosition = 20;
  
  // ============================================================================
  // HEADER SECTION (Left & Right Split Layout)
  // ============================================================================
  
  // Left Side: Company Name & Report Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(data.companyName, marginX, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 130, 140);
  doc.text('PAYMENT HISTORY REPORT', marginX, yPosition);

  // Right Side: Meta Data (Date, Type, Filters)
  let rightY = 18;
  const rightX = pageWidth - marginX;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated on: ${reportDate}`, rightX, rightY, { align: 'right' });
  rightY += 5;

  if (data.filters) {
    const filterTexts: string[] = [];
    if (data.filters.paymentType) filterTexts.push(`Type: ${data.filters.paymentType.replace('_', ' ')}`);
    if (data.filters.paymentMode) filterTexts.push(`Mode: ${data.filters.paymentMode.replace('_', ' ')}`);
    if (data.filters.branch) filterTexts.push(`Branch: ${data.filters.branch}`);
    if (data.filters.dateRange) filterTexts.push(`Period: ${data.filters.dateRange}`);
    
    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(' | ')}`, rightX, rightY, { align: 'right' });
    }
  }
  
  // Horizontal Separator Line
  yPosition = Math.max(yPosition, rightY) + 8;
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.5);
  doc.line(marginX, yPosition, pageWidth - marginX, yPosition);
  yPosition += 10;
  
  // ============================================================================
  // SUMMARY SECTION (Cards Layout)
  // ============================================================================
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('SUMMARY DASHBOARD', marginX, yPosition);
  yPosition += 6;
  
  // Dynamic calculation for evenly spaced summary boxes (3 boxes for Payments)
  const gap = 5;
  const numberOfBoxes = 3;
  const totalGapSpace = gap * (numberOfBoxes - 1);
  const boxWidth = (pageWidth - (marginX * 2) - totalGapSpace) / numberOfBoxes;
  const boxHeight = 26; 
  const boxY = yPosition;
  const centerXOffset = boxWidth / 2;
  
  let currentX = marginX;

  // Box 1: Total Payments
  doc.setFillColor(240, 247, 255); // Light Blue
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.2);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Total Payments', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${data.payments.length}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('transactions', currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  // Box 2: Total Amount Collected
  currentX += boxWidth + gap;
  doc.setFillColor(236, 253, 245); // Light Green
  doc.setDrawColor(...successColor);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Total Amount Collected', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...successColor);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('received', currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  // Box 3: Average Payment
  currentX += boxWidth + gap;
  const avgPayment = data.payments.length > 0 ? data.totalAmount / data.payments.length : 0;
  
  doc.setFillColor(248, 249, 250); // Light Grey
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Average Payment', currentX + centerXOffset, boxY + 7, { align: 'center', baseline: 'middle' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(`Rs. ${avgPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, currentX + centerXOffset, boxY + 13.5, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('per transaction', currentX + centerXOffset, boxY + 20, { align: 'center', baseline: 'middle' });
  
  yPosition = boxY + boxHeight + 12;
  
  // ============================================================================
  // TABLE SECTION
  // ============================================================================
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('PAYMENT DETAILS', marginX, yPosition);
  yPosition += 5;
  
  const tableData = data.payments.map((payment, index) => {
    const paymentDate = new Date(payment.payment_date);
    const formattedDate = paymentDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = paymentDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return [
      (index + 1).toString(),
      `${formattedDate}\n${formattedTime}`,
      payment.borrower_name,
      `Rs. ${payment.amount.toLocaleString('en-IN')}`,
      payment.payment_type.replace('_', ' '),
      payment.payment_mode.replace('_', ' '),
      payment.collected_by_name,
      payment.whatsapp_sent ? '✓' : '-',
    ];
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Date & Time', 'Borrower', 'Amount', 'Type', 'Mode', 'Collected By', 'WhatsApp']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      lineColor: [230, 235, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      // Removed global 'halign: center'
      valign: 'middle'
    },
    bodyStyles: {
      textColor: textColor,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 35 },
      5: { halign: 'center', cellWidth: 35 },
      6: { halign: 'left', cellWidth: 45 },
      7: { halign: 'center', cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Color code payment type column
      if (data.column.index === 4 && data.section === 'body') {
        const type = data.cell.raw as string;
        if (type.toLowerCase().includes('full')) {
          data.cell.styles.fillColor = [236, 253, 245];
          data.cell.styles.textColor = successColor;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.fillColor = [240, 247, 255];
          data.cell.styles.textColor = primaryColor;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Color code WhatsApp column
      if (data.column.index === 7 && data.section === 'body') {
        const sent = data.cell.raw as string;
        if (sent === '✓') {
          data.cell.styles.textColor = successColor;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        }
      }
    },
    margin: { left: marginX, right: marginX },
    alternateRowStyles: {
      fillColor: [249, 250, 252],
    },
  });
  
  // ============================================================================
  // FOOTER
  // ============================================================================
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${data.companyName} - Payment History Report`,
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: 'right' }
    );
  }
  
  // Save PDF
  const filename = `Payment_History_${new Date().getTime()}.pdf`;
  doc.save(filename);
};