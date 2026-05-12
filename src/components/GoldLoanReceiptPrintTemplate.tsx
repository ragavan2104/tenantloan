interface GoldLoanReceiptPrintTemplateProps {
  borrower: any;
  collateral: any;
  goldItems: any[];
  loanId: string;
  companyName?: string;
}

export const GoldLoanReceiptPrintTemplate = ({
  borrower,
  collateral,
  goldItems,
  loanId,
  companyName,
}: GoldLoanReceiptPrintTemplateProps) => {
  const loanAmount = borrower?.loan_amount || 0;
  const monthlyInterest = borrower?.monthly_emi || 0;
  const totalPayable = borrower?.total_payable || 0;
  const totalWeight = collateral?.total_gold_weight || 0;
  const goldValue = collateral?.gold_value || 0;

  return (
    <div className="print-content" style={{ display: 'none', background: 'white', color: 'black' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-content,
          .print-content * {
            visibility: visible;
          }

          .print-content {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }
        }
      `}</style>

      <div style={{ border: '2px solid #111', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
            {companyName || 'Loan Management Company'}
          </p>
          <h1 style={{ margin: 0, fontSize: 22 }}>GOLD LOAN RECEIPT</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
            Generated on {new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN')}
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ width: '28%', padding: '6px 0', fontWeight: 700 }}>Receipt / Loan ID</td>
              <td style={{ padding: '6px 0' }}>{loanId}</td>
              <td style={{ width: '28%', padding: '6px 0', fontWeight: 700 }}>Loan Start Date</td>
              <td style={{ padding: '6px 0' }}>
                {borrower?.start_date ? new Date(borrower.start_date).toLocaleDateString('en-IN') : 'N/A'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Borrower Name</td>
              <td style={{ padding: '6px 0' }}>{borrower?.name || 'N/A'}</td>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Phone</td>
              <td style={{ padding: '6px 0' }}>{borrower?.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Address</td>
              <td colSpan={3} style={{ padding: '6px 0' }}>{borrower?.address || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: 15, marginBottom: 8, borderBottom: '1px solid #222', paddingBottom: 4 }}>
          Loan Summary
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ width: '35%', padding: '6px 0', fontWeight: 700 }}>Loan Amount</td>
              <td style={{ padding: '6px 0' }}>Rs. {loanAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Monthly Interest Due</td>
              <td style={{ padding: '6px 0' }}>Rs. {monthlyInterest.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Total Payable</td>
              <td style={{ padding: '6px 0' }}>Rs. {totalPayable.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Repayment Type</td>
              <td style={{ padding: '6px 0' }}>Bullet (Interest monthly, principal at closure)</td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: 15, marginBottom: 8, borderBottom: '1px solid #222', paddingBottom: 4 }}>
          Gold Collateral Details
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ width: '35%', padding: '6px 0', fontWeight: 700 }}>Total Gold Weight</td>
              <td style={{ padding: '6px 0' }}>{totalWeight} g</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 700 }}>Gold Valuation</td>
              <td style={{ padding: '6px 0' }}>Rs. {goldValue.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #222', padding: 6, textAlign: 'left' }}>#</th>
              <th style={{ border: '1px solid #222', padding: 6, textAlign: 'left' }}>Item Description</th>
              <th style={{ border: '1px solid #222', padding: 6, textAlign: 'right' }}>Weight (g)</th>
              <th style={{ border: '1px solid #222', padding: 6, textAlign: 'right' }}>Purity</th>
            </tr>
          </thead>
          <tbody>
            {goldItems.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #222', padding: 8, textAlign: 'center' }}>No gold item details</td>
              </tr>
            ) : (
              goldItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #222', padding: 6 }}>{index + 1}</td>
                  <td style={{ border: '1px solid #222', padding: 6 }}>{item.description || '-'}</td>
                  <td style={{ border: '1px solid #222', padding: 6, textAlign: 'right' }}>{item.weight_grams || 0}</td>
                  <td style={{ border: '1px solid #222', padding: 6, textAlign: 'right' }}>{item.purity || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p style={{ fontSize: 11, marginBottom: 22 }}>
          I confirm that the above gold items are pledged as collateral for the loan and received into secured locker custody.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #222', paddingTop: 6, fontSize: 12 }}>Borrower Signature</div>
          </div>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #222', paddingTop: 6, fontSize: 12 }}>Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
