import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { loanApi } from '../api/loanApi';
import { companyApi } from '../api/companyApi';
import { ArrowLeftIcon, PrinterIcon, PhoneIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { LoanDetailsPrintTemplate } from '../components/LoanDetailsPrintTemplate';

const LoanDetails = () => {
  const { borrowerId, loanId } = useParams<{ borrowerId: string; loanId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: borrower, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower', borrowerId],
    queryFn: () => borrowerApi.getById(borrowerId!),
    enabled: !!borrowerId,
  });

  const { data: loanSummary, isLoading: loansLoading } = useQuery({
    queryKey: ['borrower-loans', borrowerId],
    queryFn: () => loanApi.getBorrowerLoans(borrowerId!),
    enabled: !!borrowerId,
  });

  const { data: schedule } = useQuery({
    queryKey: ['borrower-schedule', borrowerId],
    queryFn: () => loanApi.getSchedule(borrowerId!),
    enabled: !!borrowerId,
  });

  const { data: companyData } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  // Find the specific loan
  const loan = loanSummary?.loans.find(l => l.id === loanId);
  
  // Filter schedule for this specific loan
  const loanSchedule = schedule?.filter(s => s.loan_id === loanId) || [];

  // Redirect if loan not found after loading
  useEffect(() => {
    if (!loansLoading && !loan) {
      navigate(`/borrowers/${borrowerId}`);
    }
  }, [loan, loansLoading, borrowerId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (borrowerLoading || loansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!borrower || !loan) {
    return <div className="text-center text-slate-400">Loan not found</div>;
  }

  return (
    <>
      {/* Screen View */}
      <div className="space-y-6 max-w-7xl print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/borrowers/${borrowerId}`} className="p-2 hover:bg-surface-gray-light rounded-lg">
              <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Loan Details</h1>
              <p className="text-slate-400 mt-1">Loan #{loan.loan_number} - {borrower.name}</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" />
            Print
          </button>
        </div>

        {/* Borrower Info Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Borrower Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Full Name</p>
              <p className="text-sm font-medium text-slate-100">{borrower.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                <p className="text-sm font-medium text-slate-100">{borrower.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Address</p>
                <p className="text-sm font-medium text-slate-100">{borrower.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Summary Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-100">Loan Summary</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              loan.loan_status === 'active' ? 'bg-success/10 text-success' : 
              loan.loan_status === 'completed' ? 'bg-info/10 text-info' : 
              'bg-slate-500/10 text-slate-400'
            }`}>
              {loan.loan_status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Loan Number</p>
              <p className="text-lg font-bold text-slate-100">#{loan.loan_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
              <p className="text-lg font-bold text-slate-100 mono-number">
                ₹{loan.loan_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
              <p className="text-lg font-bold text-slate-100">
                {loan.interest_rate}% p.a.
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Interest Type</p>
              <p className="text-lg font-bold text-slate-100 capitalize">
                {loan.interest_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Tenure</p>
              <p className="text-lg font-bold text-slate-100">
                {loan.tenure_months} months
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
              <p className="text-lg font-bold text-primary mono-number">
                ₹{loan.monthly_emi.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Payable</p>
              <p className="text-lg font-bold text-slate-100 mono-number">
                ₹{loan.total_payable.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Interest</p>
              <p className="text-lg font-bold text-warning mono-number">
                ₹{(loan.total_payable - loan.loan_amount).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-slate-100">
                  {new Date(loan.start_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-success mono-number">
                ₹{loan.amount_paid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
              <p className="text-lg font-bold text-warning mono-number">
                ₹{loan.outstanding_balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* EMI Schedule */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            EMI Payment Schedule ({loanSchedule.length} installments)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Installment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Due Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Due Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {loanSchedule.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-zinc-900/30' : ''}>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {item.installment_no}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {new Date(item.due_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-100 text-right mono-number">
                      ₹{item.due_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${item.status === 'paid' ? 'bg-success/10 text-success' : 
                          item.status === 'overdue' ? 'bg-danger/10 text-danger' : 
                          'bg-warning/10 text-warning'}
                        capitalize
                      `}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {item.paid_on ? new Date(item.paid_on).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-500">
            Generated on {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} • {borrower.branch_name || 'Branch'}
          </p>
        </div>
      </div>

      {/* Print View - Using Professional Template */}
      <LoanDetailsPrintTemplate 
        borrower={borrower}
        loan={loan}
        loanSchedule={loanSchedule}
        companyName={companyData?.name || 'Lend Flow'}
        branchName={borrower.branch_name || 'Main Branch'}
      />
    </>
  );
};

export default LoanDetails;
