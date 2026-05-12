import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanApi } from '../api/loanApi';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  BanknotesIcon, 
  UserIcon, 
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import LoanTypeIcon from '../components/LoanTypeIcon';

const RecentLoans = () => {
  const [daysFilter, setDaysFilter] = useState(30);
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const { data: recentLoansData, isLoading } = useQuery({
    queryKey: ['recent-loans', daysFilter],
    queryFn: () => loanApi.getRecentLoans(daysFilter, 100),
  });

  const loans = recentLoansData?.loans || [];

  // Get unique branches for filter
  const branches = Array.from(new Set(loans.map((loan: any) => loan.branch_name)));

  // Apply filters
  const filteredLoans = loans.filter((loan: any) => {
    const typeMatch = loanTypeFilter === 'all' || loan.loan_type === loanTypeFilter;
    const branchMatch = branchFilter === 'all' || loan.branch_name === branchFilter;
    return typeMatch && branchMatch;
  });

  // Calculate stats
  const totalAmount = filteredLoans.reduce((sum: number, loan: any) => sum + loan.loan_amount, 0);
  const totalEMI = filteredLoans.reduce((sum: number, loan: any) => sum + loan.monthly_emi, 0);

  const exportToCSV = () => {
    const headers = ['Loan #', 'Borrower Name', 'Phone', 'Branch', 'Loan Type', 'Amount', 'EMI', 'Tenure', 'Interest', 'Status', 'Created Date'];
    const rows = filteredLoans.map((loan: any) => [
      loan.loan_number,
      loan.borrower_name,
      loan.borrower_phone,
      loan.branch_name,
      loan.loan_type,
      loan.loan_amount,
      loan.monthly_emi,
      `${loan.tenure_months} months`,
      `${loan.interest_rate}% ${loan.interest_type}`,
      loan.loan_status,
      new Date(loan.created_at).toLocaleDateString('en-IN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recent_loans_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="page-title">Recent Loans</h1>
            <p className="page-subtitle">View newly created loans</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-primary flex items-center gap-2"
          disabled={filteredLoans.length === 0}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Loans</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{filteredLoans.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last {daysFilter} days</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Amount</p>
          <p className="text-2xl font-bold text-primary mono-number">
            ₹{totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Monthly EMI</p>
          <p className="text-2xl font-bold text-success mono-number">
            ₹{totalEMI.toLocaleString()}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Avg Loan Amount</p>
          <p className="text-2xl font-bold text-warning mono-number">
            ₹{filteredLoans.length > 0 ? Math.round(totalAmount / filteredLoans.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="page-card">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Period
            </label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={7}>Last 7 days</option>
              <option value={15}>Last 15 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Loan Type
            </label>
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="personal">Personal</option>
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Branches</option>
              {branches.map((branch: string) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="page-card">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Loans ({filteredLoans.length})
        </h2>
        
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No loans found for the selected filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan: any) => (
              <div 
                key={loan.loan_id} 
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 transition-colors hover:border-primary/30 dark:border-zinc-800 dark:bg-surface-gray-light"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - Borrower Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <LoanTypeIcon type={loan.loan_type} size="lg" className="text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/borrowers/${loan.borrower_id}`}
                            className="text-lg font-semibold text-slate-100 hover:text-primary transition-colors"
                          >
                            {loan.borrower_name}
                          </Link>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                            Loan #{loan.loan_number}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded capitalize ${
                            loan.loan_status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {loan.loan_status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{loan.borrower_phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            <span>{loan.branch_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(loan.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section - Loan Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
                      <p className="text-sm font-semibold text-slate-100 mono-number">
                        ₹{loan.loan_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
                      <p className="text-sm font-semibold text-primary mono-number">
                        ₹{loan.monthly_emi.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Tenure</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {loan.tenure_months} months
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Interest</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {loan.interest_rate}% {loan.interest_type === 'flat' ? 'Flat' : 'RB'}
                      </p>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/borrowers/${loan.borrower_id}/loans/${loan.loan_id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentLoans;
