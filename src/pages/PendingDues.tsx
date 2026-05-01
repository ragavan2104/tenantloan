import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { branchApi } from '../api/branchApi';
import { companyApi } from '../api/companyApi';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BanknotesIcon,
  PhoneIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { generatePendingDuesPDF } from '../utils/pdfGenerator';

interface PendingDue {
  id: string;
  name: string;
  phone: string;
  aadhar_number?: string;
  branch_id: string;
  branch_name?: string;
  next_due_date: string;
  emi_amount: number;
  outstanding_amount: number;
  status: string;
  active_loans_count: number;
}

interface PendingDuesResponse {
  borrowers: PendingDue[];
  summary: {
    total_pending: number;
    total_overdue: number;
    count_pending: number;
    count_overdue: number;
    total_count: number;
  };
}

const PendingDues = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [status, setStatus] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
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

  const { data, isLoading } = useQuery<PendingDuesResponse>({
    queryKey: ['pending-dues', status, branchFilter, search, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (branchFilter) params.append('branch_filter', branchFilter);
      if (search) params.append('search', search);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const response = await borrowerApi.getPendingDues(params.toString());
      return response;
    },
  });

  const handleClearFilters = () => {
    setStatus('all');
    setBranchFilter('');
    setSearch('');
    setFromDate('');
    setToDate('');
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'pdf') {
      // Generate PDF on frontend
      if (!data || !companyData) {
        alert('Data not loaded yet');
        return;
      }

      // Get branch name if filtered
      let branchName = 'All Branches';
      if (branchFilter && branches) {
        const branch = branches.find(b => b.id === branchFilter);
        branchName = branch?.name || branchFilter;
      }

      // Build report type string
      let reportType = 'All Pending Dues';
      if (status === 'pending') reportType = 'Pending Only';
      if (status === 'overdue') reportType = 'Overdue Only';

      // Build date range string
      let dateRange = '';
      if (fromDate && toDate) {
        dateRange = `${new Date(fromDate).toLocaleDateString('en-IN')} to ${new Date(toDate).toLocaleDateString('en-IN')}`;
      } else if (fromDate) {
        dateRange = `From ${new Date(fromDate).toLocaleDateString('en-IN')}`;
      } else if (toDate) {
        dateRange = `Until ${new Date(toDate).toLocaleDateString('en-IN')}`;
      }

      generatePendingDuesPDF({
        borrowers: data.borrowers,
        summary: data.summary,
        companyName: companyData.name,
        reportType,
        filters: {
          status: status !== 'all' ? status : undefined,
          branch: branchFilter ? branchName : undefined,
          dateRange: dateRange || undefined,
        },
      });
    } else {
      // Excel export via backend
      try {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (branchFilter) params.append('branch_filter', branchFilter);
        if (search) params.append('search', search);
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        
        const url = `/borrowers/pending-dues/export/excel?${params.toString()}`;
        const response = await fetch(`http://localhost:8000${url}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `pending_dues_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data');
      }
    }
  };

  const hasActiveFilters = status !== 'all' || branchFilter || search || fromDate || toDate;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const summary = data?.summary || {
    total_pending: 0,
    total_overdue: 0,
    count_pending: 0,
    count_overdue: 0,
    total_count: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Pending Dues</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Track and manage pending payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="btn-secondary flex items-center gap-2"
            disabled={!data?.borrowers || data.borrowers.length === 0}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn-secondary flex items-center gap-2"
            disabled={!data?.borrowers || data.borrowers.length === 0}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mono-number">
                ₹{summary.total_pending.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{summary.count_pending} borrowers</p>
            </div>
            <ClockIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="glass-card p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mono-number">
                ₹{summary.total_overdue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{summary.count_overdue} borrowers</p>
            </div>
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400 opacity-50" />
          </div>
        </div>

        <div className="glass-card p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Borrowers</p>
              <p className="text-2xl font-bold text-primary mono-number">
                {summary.total_count}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">With pending dues</p>
            </div>
            <BanknotesIcon className="w-10 h-10 text-primary opacity-50" />
          </div>
        </div>

        <div className="glass-card p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Combined Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mono-number">
                ₹{(summary.total_pending + summary.total_overdue).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">All pending amounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4 bg-white dark:bg-zinc-900">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by name or phone number..."
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 hover:text-primary transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All</option>
                <option value="pending">Pending Only</option>
                <option value="overdue">Overdue Only</option>
              </select>
            </div>

            {/* Branch Filter (Owner only) */}
            {user?.role === 'owner' && branches && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Branch
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
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

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-field"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="glass-card p-6 bg-white dark:bg-zinc-900">
        {data?.borrowers && data.borrowers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Borrower</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Phone</th>
                  {user?.role === 'owner' && (
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Branch</th>
                  )}
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Due Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">EMI Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Outstanding</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.borrowers.map((borrower) => (
                  <tr key={borrower.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/borrowers/${borrower.id}`}
                        className="text-sm text-gray-900 dark:text-slate-100 hover:text-primary font-medium"
                      >
                        {borrower.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-slate-300">{borrower.phone}</td>
                    {user?.role === 'owner' && (
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">{borrower.branch_name || 'N/A'}</td>
                    )}
                    <td className="py-3 px-4 text-center text-sm text-gray-700 dark:text-slate-300">
                      {new Date(borrower.next_due_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-slate-100 mono-number">
                      ₹{borrower.emi_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-slate-100 mono-number">
                      ₹{borrower.outstanding_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {borrower.status === 'overdue' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs rounded-full border border-red-200 dark:border-red-500/30">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full border border-yellow-200 dark:border-yellow-500/30">
                          <ClockIcon className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/borrowers/${borrower.id}`}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Pay
                        </Link>
                        <a
                          href={`https://wa.me/${borrower.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1 px-2"
                          title="Send WhatsApp reminder"
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {hasActiveFilters ? 'No pending dues found matching your filters' : 'No pending dues at the moment'}
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
  );
};

export default PendingDues;
