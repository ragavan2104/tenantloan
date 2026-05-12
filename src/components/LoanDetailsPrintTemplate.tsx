import { Loan } from '../api/loanApi';

interface LoanDetailsPrintTemplateProps {
  borrower: any;
  loan: Loan;
  loanSchedule: any[];
  companyName?: string;
  branchName?: string;
}

export const LoanDetailsPrintTemplate = ({
  borrower,
  loan,
  loanSchedule,
  companyName = 'Lend Flow',
  branchName = 'Main Branch',
}: LoanDetailsPrintTemplateProps) => {
  // Calculate running balance for amortization
  const scheduleWithBalance = loanSchedule.map((item, index) => {
    const runningBalance = loan.total_payable - (item.due_amount * (index + 1));
    return {
      ...item,
      runningBalance: Math.max(0, runningBalance),
    };
  });

  // Calculate summary
  const totalPaid = loanSchedule
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.due_amount, 0);

  const totalPending = loanSchedule
    .filter(item => item.status !== 'paid')
    .reduce((sum, item) => sum + item.due_amount, 0);

  const paidCount = loanSchedule.filter(item => item.status === 'paid').length;
  const pendingCount = loanSchedule.filter(item => item.status !== 'paid').length;

  return (
    <div className="print-content" style={{ display: 'none', background: 'white', color: 'black' }}>
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-content {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          
          .print-content,
          .print-content * {
            visibility: visible !important;
          }
          
          .print-content table {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 10px;
          }
          
          .print-content thead {
            display: table-header-group;
            background-color: #e0e0e0;
          }
          
          .print-content tbody {
            display: table-row-group;
          }
          
          .print-content tfoot {
            display: table-footer-group;
          }
          
          .print-content tr {
            page-break-inside: avoid;
          }
          
          .print-content th {
            border: 1px solid #333;
            padding: 6px 5px;
            text-align: left;
            font-weight: bold;
            background-color: #e0e0e0;
            color: black;
            font-size: 9px;
          }
          
          .print-content td {
            border: 1px solid #333;
            padding: 5px 5px;
            color: black;
          }
          
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            margin: 0;
            background: white;
            color: black;
            page-break-after: always;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.5;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          .header-section {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #000;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: black;
          }
          
          .company-subtitle {
            font-size: 12px;
            color: black;
            margin: 3px 0;
          }
          
          h1, h2, h3 {
            color: black;
          }
          
          h1 {
            font-size: 22px;
            margin: 20px 0 10px 0;
            font-weight: bold;
            color: black;
          }
          
          h2 {
            font-size: 14px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            color: black;
          }
          
          .info-grid {
            display: grid;
            gap: 12px;
            margin-bottom: 12px;
          }
          
          .info-grid.col-2 {
            grid-template-columns: 1fr 1fr;
          }
          
          .info-grid.col-3 {
            grid-template-columns: 1fr 1fr 1fr;
          }
          
          .info-block {
            margin-bottom: 8px;
            color: black;
          }
          
          .info-label {
            font-size: 10px;
            color: #333;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .info-value {
            font-size: 13px;
            color: black;
            font-weight: bold;
          }
          
          .summary-box {
            border: 2px solid #000;
            padding: 12px;
            margin: 12px 0;
            background: #f5f5f5;
            color: black;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
            color: black;
          }
          
          .summary-row-label {
            font-weight: bold;
            color: #333;
          }
          
          .summary-row-value {
            font-weight: bold;
            color: black;
            text-align: right;
          }
          
          .summary-row-total {
            border-top: 1px solid #000;
            padding-top: 6px;
            margin-top: 6px;
            font-size: 12px;
            font-weight: bold;
            color: black;
          }
          
          .signature-section {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            color: black;
          }
          
          .signature-block {
            text-align: center;
            color: black;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 10px;
            font-weight: bold;
            color: black;
          }
          
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 9px;
            color: black;
          }
          
          .page-number {
            text-align: right;
            font-size: 9px;
            color: #666;
            margin-top: 10px;
          }
          
          .highlight-outstanding {
            color: #d32f2f;
            font-weight: bold;
            font-size: 14px;
          }
          
          .status-paid {
            background-color: #e8f5e9 !important;
            color: black;
          }
          
          .status-overdue {
            background-color: #ffebee !important;
            color: black;
          }
          
          .status-pending {
            background-color: #fff9c4 !important;
            color: black;
          }
        }
      `}</style>

      {/* PAGE 1: Loan Agreement & Overview */}
      <div className="print-page">
        {/* Header */}
        <div className="header-section">
          <div className="company-name">{companyName}</div>
          <div className="company-subtitle">{branchName}</div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1>LOAN STATEMENT & AGREEMENT</h1>
          <div style={{ fontSize: '11px', marginTop: '5px' }}>
            <p style={{ margin: '2px 0' }}>Loan #: {loan.loan_number}</p>
            <p style={{ margin: '2px 0' }}>
              Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Borrower Information */}
        <h2>BORROWER INFORMATION</h2>
        <div className="info-grid col-2">
          <div className="info-block">
            <div className="info-label">Borrower Name</div>
            <div className="info-value">{borrower.name}</div>
          </div>
          <div className="info-block">
            <div className="info-label">Phone Number</div>
            <div className="info-value">{borrower.phone}</div>
          </div>
          <div className="info-block" style={{ gridColumn: '1 / -1' }}>
            <div className="info-label">Address</div>
            <div className="info-value">{borrower.address}</div>
          </div>
        </div>

        {/* Loan Overview */}
        <h2>LOAN OVERVIEW</h2>
        <div className="info-grid">
          <div className="info-block">
            <div className="info-label">Loan Amount</div>
            <div className="info-value">₹{loan.loan_amount.toLocaleString('en-IN')}</div>
          </div>
          <div className="info-block">
            <div className="info-label">Interest Rate</div>
            <div className="info-value">{loan.interest_rate}% p.a.</div>
          </div>
          <div className="info-block">
            <div className="info-label">Tenure</div>
            <div className="info-value">{loan.tenure_months} Months</div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-block">
            <div className="info-label">Monthly EMI</div>
            <div className="info-value">₹{loan.monthly_emi.toLocaleString('en-IN')}</div>
          </div>
          <div className="info-block">
            <div className="info-label">Total Payable</div>
            <div className="info-value">₹{loan.total_payable.toLocaleString('en-IN')}</div>
          </div>
          <div className="info-block">
            <div className="info-label">Total Interest</div>
            <div className="info-value">₹{(loan.total_payable - loan.loan_amount).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Current Status */}
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-row-label">Loan Status:</span>
            <span className="summary-row-value">{loan.loan_status.toUpperCase()}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Start Date:</span>
            <span className="summary-row-value">
              {new Date(loan.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Interest Type:</span>
            <span className="summary-row-value">{loan.interest_type.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-block">
            <div className="signature-line">Borrower Signature</div>
            <p style={{ fontSize: '10px', marginTop: '5px' }}>{borrower.name}</p>
          </div>
          <div className="signature-block">
            <div className="signature-line">Authorized Representative</div>
            <p style={{ fontSize: '10px', marginTop: '5px' }}>{branchName}</p>
          </div>
        </div>

        <div className="footer">
          Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at{' '}
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="page-number">Page 1 of 2</div>
      </div>

      {/* PAGE 2: EMI Schedule (Bank Statement Style) */}
      <div className="print-page">
        {/* Header */}
        <div className="header-section">
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>EMI PAYMENT SCHEDULE</div>
          <div style={{ fontSize: '10px', marginTop: '5px' }}>Loan #{loan.loan_number} - {borrower.name}</div>
        </div>

        {/* Schedule Summary */}
        <h2>PAYMENT SUMMARY</h2>
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-row-label">Total Installments:</span>
            <span className="summary-row-value">{loanSchedule.length}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Paid Installments:</span>
            <span className="summary-row-value">{paidCount}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Pending Installments:</span>
            <span className="summary-row-value">{pendingCount}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Total Paid:</span>
            <span className="summary-row-value">₹{totalPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Total Pending:</span>
            <span className="summary-row-value">₹{totalPending.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row summary-row-total">
            <span className="summary-row-label">Outstanding Balance:</span>
            <span className="highlight-outstanding">₹{loan.outstanding_balance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Monthly Payment Schedule Table */}
        <h2>MONTHLY PAYMENT SCHEDULE</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>No.</th>
              <th style={{ width: '18%' }}>Due Date</th>
              <th style={{ width: '15%', textAlign: 'right' }}>EMI Amount</th>
              <th style={{ width: '14%' }}>Paid On</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Balance</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {scheduleWithBalance.map((item, index) => (
              <tr key={item.id}>
                <td className="center">{item.installment_no}</td>
                <td>
                  {new Date(item.due_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="number">₹{item.due_amount.toLocaleString('en-IN')}</td>
                <td>
                  {item.paid_on
                    ? new Date(item.paid_on).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="number">₹{item.runningBalance.toLocaleString('en-IN')}</td>
                <td
                  className={`center ${
                    item.status === 'paid' ? 'status-paid' : item.status === 'overdue' ? 'status-overdue' : 'status-pending'
                  }`}
                >
                  {item.status === 'paid' ? '✓ PAID' : item.status === 'overdue' ? '⚠ OVERDUE' : 'PENDING'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="center" style={{ fontWeight: 'bold' }}>
                TOTAL:
              </td>
              <td className="number">₹{loanSchedule.reduce((sum, item) => sum + item.due_amount, 0).toLocaleString('en-IN')}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>

        {/* Important Notes */}
        <div style={{ marginTop: '15px', fontSize: '9px', lineHeight: '1.6', color: '#333', backgroundColor: '#fafafa', padding: '10px', border: '1px solid #ddd' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>📌 Important Notes:</p>
          <ul style={{ marginLeft: '15px', margin: '5px 0' }}>
            <li>Please make payments on or before the due date to avoid penalties.</li>
            <li>Running Balance shows the remaining loan amount after each payment.</li>
            <li>In case of late payment, penalties may be charged as per company policy.</li>
            <li>Keep this document safe for future reference and dispute resolution.</li>
          </ul>
        </div>

        <div className="footer">
          This is an official loan statement. For inquiries, contact {branchName}
        </div>

        <div className="page-number">Page 2 of 2</div>
      </div>
    </div>
  );
};