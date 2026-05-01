import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';
import { branchApi } from '../api/branchApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, ChartBarIcon, BuildingOfficeIcon, CurrencyRupeeIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { data: overdue } = useQuery({
    queryKey: ['overdue'],
    queryFn: () => reportApi.getOverdue(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
    enabled: user?.role === 'owner',
  });

  // Get branch report for non-owners
  const { data: branchReport } = useQuery({
    queryKey: ['branch-report', user?.branchId, dateRange.from, dateRange.to],
    queryFn: () => reportApi.getBranchReport(user?.branchId || '', dateRange.from, dateRange.to),
    enabled: !!user?.branchId && user?.role !== 'owner',
  });

  // Get company report for owners
  const { data: companyReport } = useQuery({
    queryKey: ['company-report', selectedBranch, dateRange.from, dateRange.to],
    queryFn: () => reportApi.getCompanyReport(
      selectedBranch === 'all' ? undefined : selectedBranch,
      dateRange.from,
      dateRange.to
    ),
    enabled: user?.role === 'owner',
  });

  const isOwner = user?.role === 'owner';

  // Calculate consolidated stats for owner
  const consolidatedStats = companyReport ? {
    totalBorrowers: companyReport.company_stats.total_borrowers || 0,
    totalOutstanding: companyReport.company_stats.total_outstanding || 0,
    totalCollected: companyReport.company_stats.collections_period || 0,
    activeBranches: companyReport.company_stats.total_branches || 0,
  } : null;

  // Branch stats for non-owners
  const branchStats = branchReport?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChartBarIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {isOwner ? 'Company Reports' : 'Branch Reports'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isOwner ? 'Analytics across all branches' : 'Analytics and overdue reports'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Branch Filter (Owner Only) */}
          {isOwner && branches && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Branches</option>
                {branches.filter(b => b.status === 'active').map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Owner Dashboard - Consolidated Stats */}
      {isOwner && consolidatedStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <BuildingOfficeIcon className="w-5 h-5 text-primary" />
              <p className="text-sm text-slate-400">Active Branches</p>
            </div>
            <p className="text-3xl font-bold text-slate-100">{consolidatedStats.activeBranches}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-5 h-5 text-primary" />
              <p className="text-sm text-slate-400">Total Borrowers</p>
            </div>
            <p className="text-3xl font-bold text-slate-100">{consolidatedStats.totalBorrowers}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-warning" />
              <p className="text-sm text-slate-400">Total Outstanding</p>
            </div>
            <p className="text-3xl font-bold text-warning mono-number">
              ₹{(consolidatedStats.totalOutstanding / 100000).toFixed(1)}L
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-success" />
              <p className="text-sm text-slate-400">Collections (Period)</p>
            </div>
            <p className="text-3xl font-bold text-success mono-number">
              ₹{(consolidatedStats.totalCollected / 100000).toFixed(1)}L
            </p>
          </div>
        </div>
      )}

      {/* Branch Stats for Admin/Worker */}
      {!isOwner && branchStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-5 h-5 text-primary" />
              <p className="text-sm text-slate-400">Total Borrowers</p>
            </div>
            <p className="text-3xl font-bold text-slate-100">{branchStats.total_borrowers}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-warning" />
              <p className="text-sm text-slate-400">Total Outstanding</p>
            </div>
            <p className="text-3xl font-bold text-warning mono-number">
              ₹{(branchStats.total_outstanding / 100000).toFixed(1)}L
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-success" />
              <p className="text-sm text-slate-400">Collections (Period)</p>
            </div>
            <p className="text-3xl font-bold text-success mono-number">
              ₹{(branchStats.collections_period / 100000).toFixed(1)}L
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
              <p className="text-sm text-slate-400">Overdue Count</p>
            </div>
            <p className="text-3xl font-bold text-danger">{branchStats.overdue_count}</p>
          </div>
        </div>
      )}

      {/* Branch-wise Performance (Owner Only) */}
      {isOwner && companyReport && companyReport.branch_breakdown.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Branch Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-zebra">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Branch</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Borrowers</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Outstanding</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Collections (Period)</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {companyReport.branch_breakdown.map((branch: any) => (
                  <tr key={branch.branch_id}>
                    <td className="py-3 px-4 text-sm text-slate-100 font-medium">{branch.branch_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-100 text-right">{branch.stats.total_borrowers}</td>
                    <td className="py-3 px-4 text-sm text-warning text-right mono-number">
                      ₹{branch.stats.total_outstanding.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-success text-right mono-number">
                      ₹{branch.stats.collections_period.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-danger text-right">
                      {branch.stats.overdue_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue Borrowers */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
          Overdue Borrowers
          {isOwner && selectedBranch !== 'all' && (
            <span className="text-sm font-normal text-slate-400">
              ({branches?.find(b => b.id === selectedBranch)?.name})
            </span>
          )}
        </h2>
        {overdue && overdue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-zebra">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                  {isOwner && selectedBranch === 'all' && (
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Branch</th>
                  )}
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Phone</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">EMI</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Outstanding</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Days Overdue</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((borrower) => (
                  <tr key={borrower.borrower_id}>
                    <td className="py-3 px-4 text-sm text-slate-100">{borrower.name}</td>
                    {isOwner && selectedBranch === 'all' && (
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {branches?.find(b => b.id === borrower.branch_id)?.name || 'N/A'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-slate-300">{borrower.phone}</td>
                    <td className="py-3 px-4 text-sm text-slate-100 text-right mono-number">
                      ₹{borrower.monthly_emi.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-warning text-right mono-number">
                      ₹{borrower.outstanding_balance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge-danger">{borrower.days_overdue} days</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/borrowers/${borrower.borrower_id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">No overdue borrowers</p>
            <p className="text-sm text-slate-500 mt-1">All payments are up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
