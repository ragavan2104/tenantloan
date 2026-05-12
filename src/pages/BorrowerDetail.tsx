import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { loanApi } from '../api/loanApi';
import { paymentApi } from '../api/paymentApi';
import { ArrowLeftIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';
import LoanSchedule from '../components/LoanSchedule';

const BorrowerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  const { data: borrower, isLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => borrowerApi.getById(id!),
    enabled: !!id,
  });

  // Fetch all loans for this borrower
  const { data: loanSummary } = useQuery({
    queryKey: ['borrower-loans', id],
    queryFn: () => loanApi.getBorrowerLoans(id!),
    enabled: !!id,
  });

  // Fetch EMI schedule
  const { data: schedule } = useQuery({
    queryKey: ['borrower-schedule', id],
    queryFn: () => loanApi.getSchedule(id!),
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['borrower-payments', id],
    queryFn: () => paymentApi.getByBorrower(id!),
    enabled: !!id,
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => paymentApi.recordDuePayment(data),
    onSuccess: () => {
      // Show toast immediately
      toast.success('Payment recorded successfully!');
      
      // Close modal immediately
      setShowPaymentModal(false);
      setSelectedLoan(null);
      setPaymentAmount(0);
      setPaymentMode('cash');
      setPaymentNotes('');
      
      // Invalidate queries in background (don't wait)
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-schedule', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-payments', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    },
  });

  const settleLoanMutation = useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: any }) => 
      loanApi.settleLoan(loanId, data),
    onSuccess: () => {
      // Show toast immediately
      toast.success('Loan settled successfully!');
      
      // Close modal immediately
      setShowSettleModal(false);
      setSelectedLoan(null);
      setPaymentMode('cash');
      setTransactionRef('');
      setPaymentNotes('');
      
      // Invalidate queries in background (don't wait)
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-schedule', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-payments', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to settle loan');
    },
  });

  const openPaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.monthly_emi);
    setPaymentMode('cash');
    setPaymentNotes('');
    setTransactionRef('');
    setShowPaymentModal(true);
  };

  const openSettleModal = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentMode('cash');
    setTransactionRef('');
    setPaymentNotes('');
    setShowSettleModal(true);
  };

  const handlePayment = () => {
    if (!selectedLoan || !borrower) return;

    const payload: any = {
      borrower_id: borrower.id,
      amount: paymentAmount,
      payment_type: 'due_payment',
      payment_mode: paymentMode,
    };

    // Only include optional fields if they have values
    if (paymentNotes && paymentNotes.trim()) {
      payload.notes = paymentNotes.trim();
    }
    if (transactionRef && transactionRef.trim()) {
      payload.transaction_ref = transactionRef.trim();
    }

    paymentMutation.mutate(payload);
  };

  const handleSettleLoan = () => {
    if (!selectedLoan) return;

    const payload: any = {
      payment_mode: paymentMode,
    };

    // Only include optional fields if they have values
    if (transactionRef && transactionRef.trim()) {
      payload.transaction_ref = transactionRef.trim();
    }
    if (paymentNotes && paymentNotes.trim()) {
      payload.notes = paymentNotes.trim();
    }

    settleLoanMutation.mutate({
      loanId: selectedLoan.id,
      data: payload,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!borrower) {
    return <div className="text-center text-slate-400">Borrower not found</div>;
  }

  return (
    <div className="page-shell max-w-7xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-4">
        <Link to="/borrowers" className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800">
          <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{borrower.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-slate-400">
              {loanSummary?.total_loans || 0} {loanSummary?.total_loans === 1 ? 'Loan' : 'Loans'}
            </span>
            {loanSummary && loanSummary.active_loans > 0 && (
              <span className="badge-success">
                {loanSummary.active_loans} Active
              </span>
            )}
            {loanSummary && loanSummary.completed_loans > 0 && (
              <span className="badge-info">
                {loanSummary.completed_loans} Completed
              </span>
            )}
          </div>
        </div>
        {loanSummary && loanSummary.active_loans > 0 && (
          <Link
            to={`/borrowers/${id}/add-loan`}
            className="btn-secondary"
          >
            Add Loan
          </Link>
        )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm text-slate-100">{borrower.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-sm text-slate-100">{borrower.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Summary */}
      {loanSummary && loanSummary.total_loans > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <p className="text-sm text-slate-500 mb-2">Total Loans</p>
            <p className="text-2xl font-bold text-slate-100">
              {loanSummary.total_loans}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {loanSummary.active_loans} active, {loanSummary.completed_loans} completed
            </p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-slate-500 mb-2">Total Monthly EMI</p>
            <p className="text-2xl font-bold text-primary mono-number">
              ₹{loanSummary.total_monthly_emi.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-slate-500 mb-2">Total Outstanding</p>
            <p className="text-2xl font-bold text-warning mono-number">
              ₹{loanSummary.total_outstanding.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm text-slate-500 mb-2">Total Paid</p>
            <p className="text-2xl font-bold text-success mono-number">
              ₹{loanSummary.loans.reduce((sum, loan) => sum + loan.amount_paid, 0).toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-slate-400 mb-4">No loans found for this borrower</p>
          <Link to={`/borrowers/${id}/add-loan`} className="btn-primary">
            Add First Loan
          </Link>
        </div>
      )}

      {/* Individual Loans */}
      {loanSummary && loanSummary.loans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Loans</h2>
          {loanSummary.loans.map((loan) => (
            <div key={loan.id} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Loan #{loan.loan_number}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Started: {new Date(loan.start_date).toLocaleDateString()} • 
                    {loan.tenure_months} months • 
                    {loan.interest_rate}% {loan.interest_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    loan.loan_status === 'active' ? 'bg-success/10 text-success' : 
                    loan.loan_status === 'completed' ? 'bg-info/10 text-info' : 
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {loan.loan_status}
                  </span>
                  <Link
                    to={`/borrowers/${id}/loans/${loan.id}`}
                    className="btn-secondary text-sm"
                  >
                    View Details
                  </Link>
                  {loan.loan_status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPaymentModal(loan)}
                        className="btn-primary text-sm"
                      >
                        Pay Due
                      </button>
                      <button
                        onClick={() => openSettleModal(loan)}
                        className="btn-secondary text-sm"
                      >
                        Settle
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
                  <p className="text-lg font-semibold text-slate-100 mono-number">
                    ₹{loan.loan_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
                  <p className="text-lg font-semibold text-primary mono-number">
                    ₹{loan.monthly_emi.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
                  <p className="text-lg font-semibold text-success mono-number">
                    ₹{loan.amount_paid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                  <p className="text-lg font-semibold text-warning mono-number">
                    ₹{loan.outstanding_balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {loan.next_due_date && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-slate-500">Next Due Date</p>
                  <p className="text-sm font-medium text-slate-100 mt-1">
                    {new Date(loan.next_due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EMI Schedule */}
      {schedule && schedule.length > 0 && (
        <LoanSchedule 
          schedule={schedule} 
          borrowerName={borrower?.name}
          borrowerPhone={borrower?.phone}
        />
      )}

      {/* Payment History */}
      {payments && payments.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Payment History</h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-surface-gray-light rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-100 mono-number">
                      ₹{payment.amount.toLocaleString()}
                    </p>
                    {payment.loan_number && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        Loan #{payment.loan_number}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(payment.payment_date).toLocaleString()} • {payment.payment_mode}
                  </p>
                  {payment.notes && (
                    <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`
                    ${payment.payment_type === 'full_payment' || payment.payment_type === 'full_settlement' 
                      ? 'badge-success' : 'badge-info'}
                    capitalize text-xs
                  `}>
                    {payment.payment_type.replace('_', ' ')}
                  </span>
                  {payment.whatsapp_sent && (
                    <p className="text-xs text-success mt-1 whatsapp-badge">
                      WhatsApp sent
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Pay Due - Loan #{selectedLoan.loan_number}
            </h3>
            
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-slate-300 mb-2">Monthly EMI</p>
              <p className="text-2xl font-bold text-primary mono-number">
                ₹{selectedLoan.monthly_emi.toLocaleString()}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="input-field"
                  placeholder="Transaction ID, Cheque No, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedLoan(null);
                }}
                className="btn-secondary flex-1"
                disabled={paymentMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                disabled={paymentMutation.isPending || paymentAmount <= 0}
              >
                {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Loan Modal */}
      {showSettleModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Settle Loan #{selectedLoan.loan_number}
            </h3>
            
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-slate-300 mb-2">Outstanding Amount</p>
              <p className="text-2xl font-bold text-warning mono-number">
                ₹{selectedLoan.outstanding_balance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="input-field"
                  placeholder="Transaction ID, Cheque No, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSettleModal(false);
                  setSelectedLoan(null);
                }}
                className="btn-secondary flex-1"
                disabled={settleLoanMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSettleLoan}
                className="btn-primary flex-1"
                disabled={settleLoanMutation.isPending}
              >
                {settleLoanMutation.isPending ? 'Processing...' : 'Settle Loan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowerDetail;
