import React from 'react';
import { PrinterIcon, CalendarIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface ScheduleItem {
  id: string;
  borrower_id: string;
  loan_id?: string;
  loan_number?: number;
  installment_no: number;
  due_date: string;
  due_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_on?: string;
}

interface LoanScheduleProps {
  schedule: ScheduleItem[];
  borrowerName?: string;
  borrowerPhone?: string;
}

const LoanSchedule: React.FC<LoanScheduleProps> = ({ schedule, borrowerName, borrowerPhone }) => {
  const handlePrint = () => {
    window.print();
  };

  // Group by loan
  const groupedSchedule = schedule.reduce((acc, item) => {
    const loanKey = item.loan_number ? `Loan #${item.loan_number}` : 'Loan #1';
    if (!acc[loanKey]) {
      acc[loanKey] = [];
    }
    acc[loanKey].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Calculate totals
  const totals = schedule.reduce(
    (acc, item) => ({
      totalDue: acc.totalDue + item.due_amount,
      totalPaid: acc.totalPaid + (item.status === 'paid' ? item.due_amount : 0),
    }),
    { totalDue: 0, totalPaid: 0 }
  );

  const totalPending = totals.totalDue - totals.totalPaid;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-slate-100">EMI Schedule</h2>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2"
        >
          <PrinterIcon className="w-5 h-5" />
          Print Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
          <p className="text-xs text-slate-500 mb-1">Total EMIs</p>
          <p className="text-xl font-bold text-slate-100">{schedule.length}</p>
        </div>
        <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
          <p className="text-xs text-slate-500 mb-1">Total Amount</p>
          <p className="text-xl font-bold text-primary mono-number">₹{totals.totalDue.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
          <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
          <p className="text-xl font-bold text-success mono-number">₹{totals.totalPaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Printable Content */}
      <div className="print-content">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
                padding: 20px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .print-table th,
              .print-table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
                color: #000;
              }
              .print-table th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .print-footer {
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #000;
                font-size: 12px;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* Print Header */}
        <div className="print-header hidden print:block">
          <h1 className="text-2xl font-bold mb-2">Loan EMI Schedule</h1>
          {borrowerName && <p className="text-lg">Borrower: {borrowerName}</p>}
          {borrowerPhone && <p>Phone: {borrowerPhone}</p>}
          <p className="text-sm">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          {Object.entries(groupedSchedule).map(([loanKey, items]) => (
            <div key={loanKey} className="mb-8">
              <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-primary" />
                {loanKey}
              </h3>
              <table className="w-full table-zebra print-table">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">EMI #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Due Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount Due</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 no-print">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={item.status === 'overdue' ? 'bg-danger/5' : ''}>
                      <td className="py-3 px-4 text-sm text-slate-300 font-medium">
                        {item.installment_no}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {new Date(item.due_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-100 text-right mono-number font-semibold">
                        ₹{item.due_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`
                          ${item.status === 'paid' ? 'badge-success' : 
                            item.status === 'overdue' ? 'badge-danger' : 'badge-warning'}
                          capitalize text-xs
                        `}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300 no-print">
                        {item.paid_on ? new Date(item.paid_on).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Loan Subtotal */}
                  <tr className="border-t-2 border-zinc-700 font-semibold bg-surface-gray-light">
                    <td colSpan={2} className="py-3 px-4 text-sm text-slate-100">
                      Subtotal ({items.length} EMIs)
                    </td>
                    <td className="py-3 px-4 text-sm text-success text-right mono-number">
                      ₹{items.reduce((sum, i) => sum + i.due_amount, 0).toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        {Object.keys(groupedSchedule).length > 1 && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Grand Total EMIs</p>
                <p className="text-lg font-bold text-slate-100">{schedule.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                <p className="text-lg font-bold text-primary mono-number">₹{totals.totalDue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-success mono-number">₹{totals.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Print Footer */}
        <div className="print-footer hidden print:block">
          <p>This is a computer-generated document. No signature required.</p>
          <p>For any queries, please contact your loan officer.</p>
        </div>
      </div>
    </div>
  );
};

export default LoanSchedule;
