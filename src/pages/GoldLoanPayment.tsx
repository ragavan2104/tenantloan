import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { paymentApi } from '../api/paymentApi';
import { useToast } from '../context/ToastContext';
import LoanTypeIcon from '../components/LoanTypeIcon';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function GoldLoanPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<'interest' | 'full'>('interest');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch borrower details
  const { data: borrower, isLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => borrowerApi.getById(id!),
    enabled: !!id,
  });

  // Calculate payment amounts
  const monthlyInterest = Math.round((borrower?.monthly_emi || 0) * 100) / 100;
  const outstandingBalance = Math.round((borrower?.outstanding_balance || 0) * 100) / 100;
  const loanAmount = Math.round((borrower?.loan_amount || 0) * 100) / 100;
  const collateral = borrower?.collateral || {};
  const goldItems = collateral.gold_items || [];
  const totalWeight = collateral.total_gold_weight || 0;
  const goldValue = collateral.gold_value || 0;

  // Set default payment amount when borrower data loads
  useEffect(() => {
    if (borrower && paymentAmount === 0 && monthlyInterest > 0) {
      setPaymentAmount(Math.round(monthlyInterest * 100) / 100);
    }
  }, [borrower, monthlyInterest]);

  // Set default payment amount based on type
  const handlePaymentTypeChange = (type: 'interest' | 'full') => {
    setPaymentType(type);
    if (type === 'interest') {
      setPaymentAmount(Math.round(monthlyInterest * 100) / 100);
    } else {
      setPaymentAmount(Math.round(outstandingBalance * 100) / 100);
    }
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        borrower_id: id!,
        amount: paymentAmount,
        payment_type: (paymentType === 'full' ? 'full_payment' : 'due_payment') as 'due_payment' | 'full_payment',
        payment_mode: paymentMode,
        transaction_ref: transactionRef || undefined,
        notes: notes || undefined,
      };

      if (paymentType === 'full') {
        return paymentApi.recordFullPayment(payload);
      } else {
        return paymentApi.recordDuePayment(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      success('Payment recorded successfully!');
      navigate('/gold-loans');
    },
    onError: (err: any) => {
      error(err.response?.data?.detail || 'Failed to record payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentAmount <= 0) {
      error('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > outstandingBalance) {
      error('Payment amount cannot exceed outstanding balance');
      return;
    }

    paymentMutation.mutate();
  };

  if (isLoading) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/gold-loans')}
          className="flex items-center text-slate-400 hover:text-slate-100 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Gold Loans
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
          <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
          Gold Loan Payment
        </h1>
        <p className="text-slate-400 mt-1">Record payment for {borrower.name}</p>
      </div>

      {/* Borrower & Gold Details */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Loan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Borrower Information</h3>
            <div className="space-y-2">
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
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Gold Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Weight:</span>
                <span className="text-yellow-500 font-medium">{totalWeight}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Items:</span>
                <span className="text-slate-100 font-medium">{goldItems.length} item(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gold Value:</span>
                <span className="text-yellow-500 font-medium">₹{goldValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Locker:</span>
                <span className="text-slate-100 font-medium">{collateral.locker_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-blue-400 mb-1">Loan Amount</div>
              <div className="text-2xl font-bold text-blue-500">₹{loanAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-sm text-yellow-400 mb-1">Monthly Interest</div>
              <div className="text-2xl font-bold text-yellow-500">₹{monthlyInterest.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-sm text-red-400 mb-1">Outstanding</div>
              <div className="text-2xl font-bold text-red-500">₹{outstandingBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-6">Payment Information</h2>

        <div className="space-y-6">
          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Payment Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('interest')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'interest'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-100 mb-1">Interest Payment</div>
                  <div className="text-sm text-slate-400 mb-2">Pay monthly interest only</div>
                  <div className="text-xl font-bold text-yellow-500">₹{monthlyInterest.toLocaleString('en-IN')}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentTypeChange('full')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentType === 'full'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-100 mb-1">Full Settlement</div>
                  <div className="text-sm text-slate-400 mb-2">Pay full outstanding & release gold</div>
                  <div className="text-xl font-bold text-green-500">₹{outstandingBalance.toLocaleString('en-IN')}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="Enter amount"
              min="0"
              max={outstandingBalance}
              step="0.01"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Maximum: ₹{outstandingBalance.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Mode *
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="input-field"
              required
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Transaction Reference */}
          {paymentMode !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="input-field"
                placeholder="Enter transaction ID or reference number"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Payment Summary */}
          {paymentType === 'full' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">⚠️ Full Settlement</h3>
              <ul className="text-sm text-green-300 space-y-1">
                <li>✓ This will close the loan completely</li>
                <li>✓ Gold will be released from locker</li>
                <li>✓ Locker will be marked as available</li>
                <li>✓ Borrower can collect their gold items</li>
              </ul>
            </div>
          )}

          {paymentType === 'interest' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">Interest Payment</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• This is an interest-only payment</li>
                <li>• Principal amount remains unchanged</li>
                <li>• Gold remains in locker</li>
                <li>• Next interest payment due next month</li>
              </ul>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/gold-loans')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={paymentMutation.isPending || paymentAmount <= 0}
            className="btn-primary flex-1"
          >
            {paymentMutation.isPending ? 'Processing...' : `Record Payment of ₹${paymentAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </form>
    </div>
  );
}
