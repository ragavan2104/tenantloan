import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import { branchApi } from '../api/branchApi';
import { companyApi } from '../api/companyApi';
import { 
  FunnelIcon,
  DocumentArrowDownIcon 
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { generatePaymentsPDF } from '../utils/pdfGenerator';
import { useToast } from '../hooks/useToast';
import Logo from '../components/Logo';

const Payments = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  
  // Filter input states (not applied until user clicks Search)
  const [paymentTypeInput, setPaymentTypeInput] = useState<string>('');
  const [paymentModeInput, setPaymentModeInput] = useState<string>('');
  const [loanTypeInput, setLoanTypeInput] = useState<string>('');
  const [branchFilterInput, setBranchFilterInput] = useState<string>('');
  const [fromDateInput, setFromDateInput] = useState<string>('');
  const [toDateInput, setToDateInput] = useState<string>('');
  
  // Applied filter states (used in API query)
  const [paymentType, setPaymentType] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [loanType, setLoanType] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  const [showFilters, setShowFilters] = useState(false);

  // Get branches for filter (owner only)
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getAll(),
    enabled: user?.role === 'owner',
  });

  // Get company details for PDF header
  const { data: companyData } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', paymentType, paymentMode, loanType, fromDate, toDate, branchFilter],
    queryFn: () => paymentApi.getAll(100, 0, paymentType, paymentMode, fromDate, toDate, branchFilter, loanType),
  });

  const handleSearch = () => {
    setPaymentType(paymentTypeInput);
    setPaymentMode(paymentModeInput);
    setLoanType(loanTypeInput);
    setBranchFilter(branchFilterInput);
    setFromDate(fromDateInput);
    setToDate(toDateInput);
  };

  const handleClearFilters = () => {
    // Clear input states
    setPaymentTypeInput('');
    setPaymentModeInput('');
    setLoanTypeInput('');
    setBranchFilterInput('');
    setFromDateInput('');
    setToDateInput('');
    
    // Clear applied states
    setPaymentType('');
    setPaymentMode('');
    setLoanType('');
    setBranchFilter('');
    setFromDate('');
    setToDate('');
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'pdf') {
      // Generate PDF on frontend
      if (!payments || !companyData) {
        toast.error('Data not loaded yet. Please wait...');
        return;
      }

      if (payments.length === 0) {
        toast.warning('No payments to export');
        return;
      }

      try {
        // Get branch name if filtered
        let branchName = 'All Branches';
        if (branchFilter && branches) {
          const branch = branches.find(b => b.id === branchFilter);
          branchName = branch?.name || branchFilter;
        }

        // Build date range string
        let dateRange = '';
        if (fromDate && toDate) {
          dateRange = `${new Date(fromDate).toLocaleDateString('en-IN')} to ${new Date(toDate).toLocaleDateString('en-IN')}`;
        } else if (fromDate) {
          dateRange = `From ${new Date(fromDate).toLocaleDateString('en-IN')}`;
        } else if (toDate) {
          dateRange = `Until ${new Date(toDate).toLocaleDateString('en-IN')}`;
        }

        // Calculate total amount
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        generatePaymentsPDF({
          payments,
          companyName: companyData.name,
          totalAmount,
          filters: {
            paymentType: paymentType || undefined,
            paymentMode: paymentMode || undefined,
            branch: branchFilter ? branchName : undefined,
            dateRange: dateRange || undefined,
          },
        });
        
        toast.success(`PDF exported successfully (${payments.length} payments)`);
      } catch (error) {
        console.error('PDF export error:', error);
        toast.error('Failed to generate PDF. Please try again.');
      }
    } else {
      // Excel export via backend
      try {
        if (!payments || payments.length === 0) {
          toast.warning('No payments to export');
          return;
        }

        const params = new URLSearchParams();
        if (paymentType) params.append('payment_type', paymentType);
        if (paymentMode) params.append('payment_mode', paymentMode);
        if (loanType) params.append('loan_type', loanType);
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        if (branchFilter) params.append('branch_filter', branchFilter);
        
        const token = localStorage.getItem('token');
        const baseUrl = 'http://localhost:8000';
        const url = `${baseUrl}/payments/export/excel?${params.toString()}`;
        
        toast.info('Generating Excel report...');
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `payments_report_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        toast.success('Excel report downloaded successfully');
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export data. Please try again.');
      }
    }
  };

  const hasActiveFilters = paymentType || paymentMode || loanType || fromDate || toDate || branchFilter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <toast.ToastContainer />
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 dark:text-slate-100">Payment History</h1>
          <p className="text-slate-400 dark:text-slate-400 mt-1">All recorded payments</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
         
          <button
            onClick={() => handleExport('pdf')}
            className="btn-secondary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-primary transition-colors"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-800 dark:border-zinc-800">
            {/* Payment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                Payment Type
              </label>
              <select
                value={paymentTypeInput}
                onChange={(e) => setPaymentTypeInput(e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="due_payment">Due Payment</option>
                <option value="full_payment">Full Payment</option>
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                Payment Mode
              </label>
              <select
                value={paymentModeInput}
                onChange={(e) => setPaymentModeInput(e.target.value)}
                className="input-field"
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Loan Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                Loan Type
              </label>
              <select
                value={loanTypeInput}
                onChange={(e) => setLoanTypeInput(e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="personal">Personal</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="gold">Gold</option>
              </select>
            </div>

            {/* Branch Filter (Owner only) */}
            {user?.role === 'owner' && branches && (
              <div>
                <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                  Branch
                </label>
                <select
                  value={branchFilterInput}
                  onChange={(e) => setBranchFilterInput(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Branches</option>
                  {branches.filter(b => b.status === 'active').map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* From Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDateInput}
                onChange={(e) => setFromDateInput(e.target.value)}
                className="input-field"
              />
            </div>

            {/* To Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDateInput}
                onChange={(e) => setToDateInput(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2 lg:col-span-2">
              <button
                onClick={handleSearch}
                className="btn-primary flex-1"
              >
                Search
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary flex-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Export Info */}
        {hasActiveFilters && (
          <div className="mt-3 text-xs text-slate-400 dark:text-slate-400 flex items-center gap-2">
            <Logo size="sm" className="text-primary" />
            <span>Exports will include filtered data with all filter details in the header</span>
          </div>
        )}
      </div>

      {/* Results Count */}
      {payments && (
        <div className="text-sm text-slate-400">
          Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </div>
      )}

      <div className="glass-card p-6">
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-zebra">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Borrower</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Loan Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Mode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Collected By</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-100">{payment.borrower_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-300 capitalize">
                        {payment.loan_type || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-100 text-right mono-number">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`
                        ${payment.payment_type === 'full_payment' ? 'badge-success' : 'badge-info'}
                        capitalize text-xs
                      `}>
                        {payment.payment_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-slate-400 capitalize">
                        {payment.payment_mode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{payment.collected_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              {hasActiveFilters ? 'No payments found matching your filters' : 'No payments recorded yet'}
            </p>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="btn-secondary">
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Payments;
