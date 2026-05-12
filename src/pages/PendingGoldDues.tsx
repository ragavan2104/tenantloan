import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { branchApi } from '../api/branchApi';
import { companyApi } from '../api/companyApi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  BanknotesIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoanTypeIcon from '../components/LoanTypeIcon';
import { generatePendingDuesPDF } from '../utils/pdfGenerator';

interface PendingGoldDue {
  id: string;
  loan_id: string;
  loan_number: number;
  name: string;
  phone: string;
  branch_id: string;
  branch_name?: string;
  loan_type: string;
  next_due_date: string;
  maturity_date?: string;
  emi_amount: number;
  outstanding_amount: number;
  status: 'pending' | 'overdue';
}

interface PendingDuesResponse {
  loans: PendingGoldDue[];
  summary: {
    total_pending: number;
    total_overdue: number;
    count_pending: number;
    count_overdue: number;
    total_count: number;
  };
}

const PendingGoldDues = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Input filters
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('all');
  const [branchFilterInput, setBranchFilterInput] = useState('');
  const [maturityMonthInput, setMaturityMonthInput] = useState('');
  const [maturityFromDateInput, setMaturityFromDateInput] = useState('');
  const [maturityToDateInput, setMaturityToDateInput] = useState('');

  // Applied filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [maturityMonth, setMaturityMonth] = useState('');
  const [maturityFromDate, setMaturityFromDate] = useState('');
  const [maturityToDate, setMaturityToDate] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getAll(),
    enabled: user?.role === 'owner',
  });

  const { data: companyData } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  const { data, isLoading } = useQuery<PendingDuesResponse>({
    queryKey: [
      'pending-gold-dues',
      search,
      status,
      branchFilter,
      maturityMonth,
      maturityFromDate,
      maturityToDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('loan_type', 'gold');

      if (status && status !== 'all') params.append('status', status);
      if (branchFilter) params.append('branch_filter', branchFilter);
      if (search) params.append('search', search);
      if (maturityMonth) params.append('maturity_month', maturityMonth);
      if (maturityFromDate) params.append('maturity_from_date', maturityFromDate);
      if (maturityToDate) params.append('maturity_to_date', maturityToDate);

      return borrowerApi.getPendingDues(params.toString());
    },
  });

  const loans = data?.loans || [];

  const totalMaturityDue = loans.reduce((sum, loan) => sum + (loan.outstanding_amount || 0), 0);
  const totalMonthlyInterest = loans.reduce((sum, loan) => sum + (loan.emi_amount || 0), 0);
  const overdueCount = loans.filter((loan) => loan.status === 'overdue').length;

  const hasActiveFilters =
    !!search ||
    status !== 'all' ||
    !!branchFilter ||
    !!maturityMonth ||
    !!maturityFromDate ||
    !!maturityToDate;

  const handleSearch = () => {
    setSearch(searchInput);
    setStatus(statusInput);
    setBranchFilter(branchFilterInput);
    setMaturityMonth(maturityMonthInput);
    setMaturityFromDate(maturityFromDateInput);
    setMaturityToDate(maturityToDateInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusInput('all');
    setBranchFilterInput('');
    setMaturityMonthInput('');
    setMaturityFromDateInput('');
    setMaturityToDateInput('');

    setSearch('');
    setStatus('all');
    setBranchFilter('');
    setMaturityMonth('');
    setMaturityFromDate('');
    setMaturityToDate('');
  };

  const handleExportPdf = () => {
    if (!companyData || loans.length === 0) return;

    let branchName = 'All Branches';
    if (branchFilter && branches) {
      const branch = branches.find((b: any) => b.id === branchFilter);
      branchName = branch?.name || branchFilter;
    }

    let dateRange = '';
    if (maturityMonth) {
      dateRange = `Maturity Month: ${maturityMonth}`;
    } else if (maturityFromDate && maturityToDate) {
      dateRange = `${new Date(maturityFromDate).toLocaleDateString('en-IN')} to ${new Date(maturityToDate).toLocaleDateString('en-IN')}`;
    } else if (maturityFromDate) {
      dateRange = `From ${new Date(maturityFromDate).toLocaleDateString('en-IN')}`;
    } else if (maturityToDate) {
      dateRange = `Until ${new Date(maturityToDate).toLocaleDateString('en-IN')}`;
    }

    generatePendingDuesPDF({
      loans: loans.map((loan) => ({
        ...loan,
        next_due_date: loan.maturity_date || loan.next_due_date,
      })),
      summary: {
        total_pending: loans
          .filter((loan) => loan.status === 'pending')
          .reduce((sum, loan) => sum + (loan.emi_amount || 0), 0),
        total_overdue: loans
          .filter((loan) => loan.status === 'overdue')
          .reduce((sum, loan) => sum + (loan.emi_amount || 0), 0),
        count_pending: loans.filter((loan) => loan.status === 'pending').length,
        count_overdue: loans.filter((loan) => loan.status === 'overdue').length,
        total_count: loans.length,
      },
      companyName: companyData.name,
      reportType: 'Pending Gold Maturity Dues',
      filters: {
        status: status !== 'all' ? status : undefined,
        branch: branchFilter ? branchName : undefined,
        dateRange: dateRange || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
            <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
            Pending Gold Maturity Dues
          </h1>
          <p className="text-slate-400 mt-1">
            Filter by maturity month/date and track full settlement dues
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          className="btn-secondary flex items-center gap-2"
          disabled={loans.length === 0}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Export PDF</span>
        </button>
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by borrower name or phone..."
          />
        </div>

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

        {showFilters && (
          <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="input-field"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {user?.role === 'owner' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                <select
                  value={branchFilterInput}
                  onChange={(e) => setBranchFilterInput(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Branches</option>
                  {branches?.filter((b: any) => b.status === 'active').map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Maturity Month</label>
              <input
                type="month"
                value={maturityMonthInput}
                onChange={(e) => setMaturityMonthInput(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Maturity From</label>
              <input
                type="date"
                value={maturityFromDateInput}
                onChange={(e) => setMaturityFromDateInput(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Maturity To</label>
              <input
                type="date"
                value={maturityToDateInput}
                onChange={(e) => setMaturityToDateInput(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-end gap-2 lg:col-span-2">
              <button onClick={handleSearch} className="btn-primary flex-1">
                Search
              </button>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="btn-secondary flex-1">
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Loans Matching Filters</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{loans.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Total Maturity Due</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            ₹{Math.round(totalMaturityDue).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Monthly Interest (Reference)</div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">
            ₹{Math.round(totalMonthlyInterest).toLocaleString('en-IN')}
          </div>
          {overdueCount > 0 && (
            <div className="text-xs text-red-400 mt-1">{overdueCount} overdue</div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Borrower</th>
                {user?.role === 'owner' && (
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">Branch</th>
                )}
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Maturity Date</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Monthly Interest</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Amount Payable</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'owner' ? 7 : 6} className="text-center p-8 text-slate-400">
                    No pending gold maturity dues found
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const maturityDateText = loan.maturity_date || loan.next_due_date;
                  return (
                    <tr key={`${loan.id}-${loan.loan_id}`} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-slate-100">{loan.name}</div>
                          <div className="text-sm text-slate-400">{loan.phone}</div>
                        </div>
                      </td>
                      {user?.role === 'owner' && (
                        <td className="p-4 text-sm text-slate-300">{loan.branch_name || 'N/A'}</td>
                      )}
                      <td className="p-4 text-sm text-slate-300">
                        {maturityDateText
                          ? new Date(maturityDateText).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <ClockIcon className="w-4 h-4" />
                          <span className="font-semibold">₹{Math.round(loan.emi_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2 text-green-500">
                          <BanknotesIcon className="w-4 h-4" />
                          <span className="font-semibold">₹{Math.round(loan.outstanding_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {loan.status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                            <ClockIcon className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/gold-loans/${loan.loan_id}`}
                          className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PendingGoldDues;
