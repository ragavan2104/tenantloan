import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { borrowerApi } from '../api/borrowerApi';
import { paymentApi } from '../api/paymentApi';
import { companyApi } from '../api/companyApi';
import LoanTypeIcon from '../components/LoanTypeIcon';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { GoldLoanReceiptPrintTemplate } from '../components/GoldLoanReceiptPrintTemplate';

export default function GoldLoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handlePrint = () => {
    window.print();
  };

  const { data: borrower, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => borrowerApi.getById(id!),
    enabled: !!id,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentApi.getByBorrower(id!),
    enabled: !!id,
  });

  const { data: companyData } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  if (borrowerLoading || paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!borrower) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Borrower not found</p>
      </div>
    );
  }

  const collateral = borrower.collateral || {};
  const goldItems = collateral.gold_items || [];
  const totalWeight = collateral.total_gold_weight || 0;
  const goldValue = collateral.gold_value || 0;
  const loanAmount = borrower.loan_amount || 0;
  const monthlyInterest = borrower.monthly_emi || 0;
  const outstandingBalance = borrower.outstanding_balance || 0;
  const amountPaid = borrower.amount_paid || 0;
  const totalPayable = borrower.total_payable || 0;
  const loanStatus = borrower.loan_status || 'active';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/gold-loans')}
          className="flex items-center text-slate-400 hover:text-slate-100 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Gold Loans
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
              <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
              {borrower.name}
            </h1>
            <p className="text-slate-400 mt-1">{borrower.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              Print Receipt
            </button>
            {loanStatus === 'active' && (
              <Link
                to={`/gold-loans/${id}/pay`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Record Payment
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Loan Status Banner */}
      <div className={`glass-card p-4 border-l-4 ${
        loanStatus === 'active' ? 'border-green-500' : 'border-blue-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {loanStatus === 'active' ? '🟢 Active Loan' : '✅ Loan Completed'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {loanStatus === 'active' 
                ? 'Gold is stored in locker. Make monthly interest payments.' 
                : 'Loan has been fully settled. Gold can be collected.'}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            loanStatus === 'active' 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {loanStatus?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Borrower & Gold Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrower Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Borrower Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-slate-100 font-medium">{borrower.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="text-slate-100 font-medium">{borrower.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Address:</span>
              <span className="text-slate-100 font-medium text-right">{borrower.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loan Start Date:</span>
              <span className="text-slate-100 font-medium">
                {borrower.start_date ? new Date(borrower.start_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tenure:</span>
              <span className="text-slate-100 font-medium">{borrower.tenure_months} months</span>
            </div>
          </div>
        </div>

        {/* Gold Details */}
        <div className="glass-card p-6 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border-yellow-500/20">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <span>💰</span> Gold Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Weight:</span>
              <span className="text-yellow-400 font-semibold">{totalWeight}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Number of Items:</span>
              <span className="text-slate-100 font-medium">{goldItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gold Value:</span>
              <span className="text-yellow-400 font-semibold">₹{goldValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Location:</span>
              <span className="text-slate-100 font-medium">{collateral.storage_location || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Locker Number:</span>
              <span className="text-slate-100 font-medium">{collateral.locker_number || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gold Items List */}
      {goldItems.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Gold Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">#</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Description</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-300">Weight (g)</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-300">Purity</th>
                </tr>
              </thead>
              <tbody>
                {goldItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-zinc-800/50">
                    <td className="p-3 text-slate-400">{index + 1}</td>
                    <td className="p-3 text-slate-100">{item.description}</td>
                    <td className="p-3 text-right text-yellow-400 font-medium">{item.weight_grams}g</td>
                    <td className="p-3 text-right text-slate-100">{item.purity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loan Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
          <div className="text-sm text-blue-400 mb-1">Loan Amount</div>
          <div className="text-2xl font-bold text-blue-500">₹{loanAmount.toLocaleString('en-IN')}</div>
        </div>
        <div className="glass-card p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="text-sm text-yellow-400 mb-1">Monthly Interest</div>
          <div className="text-2xl font-bold text-yellow-500">₹{monthlyInterest.toLocaleString('en-IN')}</div>
        </div>
        <div className="glass-card p-4 bg-green-500/5 border-green-500/20">
          <div className="text-sm text-green-400 mb-1">Amount Paid</div>
          <div className="text-2xl font-bold text-green-500">₹{amountPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className="glass-card p-4 bg-red-500/5 border-red-500/20">
          <div className="text-sm text-red-400 mb-1">Outstanding</div>
          <div className="text-2xl font-bold text-red-500">₹{outstandingBalance.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Repayment Information */}
      <div className="glass-card p-6 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <h2 className="text-lg font-semibold text-blue-400 mb-4">📋 Bullet Repayment Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Monthly Payments</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Pay <span className="text-blue-400 font-semibold">₹{monthlyInterest.toLocaleString('en-IN')}</span> interest every month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Principal amount remains unchanged</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Gold stays in locker until full settlement</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Final Settlement</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Pay full outstanding: <span className="text-green-400 font-semibold">₹{outstandingBalance.toLocaleString('en-IN')}</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Locker automatically released</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Collect your gold items</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Type</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-300">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Mode</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b border-zinc-800/50">
                    <td className="p-3 text-slate-100">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        payment.payment_type === 'full_payment'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {payment.payment_type === 'full_payment' ? 'Full Settlement' : 'Interest Payment'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-green-500 font-semibold">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-100 capitalize">{payment.payment_mode}</td>
                    <td className="p-3 text-slate-400 text-sm">{payment.transaction_ref || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print-only receipt */}
      <GoldLoanReceiptPrintTemplate
        borrower={borrower}
        collateral={collateral}
        goldItems={goldItems}
        loanId={id || ''}
        companyName={companyData?.name}
      />
    </div>
  );
}
