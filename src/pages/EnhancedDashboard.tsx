import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { branchApi } from '../api/branchApi';
import { reportApi } from '../api/reportApi';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const EnhancedDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isOwner = user?.role === 'owner';

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Get branches list for owner
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
    enabled: isOwner,
  });

  // Get branch stats (for admin/worker)
  const { data: branchReport } = useQuery({
    queryKey: ['branch-report', user?.branchId, dateRange.from, dateRange.to],
    queryFn: () => reportApi.getBranchReport(user?.branchId || '', dateRange.from, dateRange.to),
    enabled: !!user?.branchId && !isOwner,
  });

  // Get company report (for owner)
  const { data: companyReport } = useQuery({
    queryKey: ['company-report', selectedBranch, dateRange.from, dateRange.to],
    queryFn: () => reportApi.getCompanyReport(
      selectedBranch === 'all' ? undefined : selectedBranch,
      dateRange.from,
      dateRange.to
    ),
    enabled: isOwner,
  });

  // Get overdue borrowers
  const { data: overdueBorrowers } = useQuery({
    queryKey: ['overdue-borrowers'],
    queryFn: reportApi.getOverdue,
  });

  // Get upcoming dues
  const { data: upcomingDues } = useQuery({
    queryKey: ['upcoming-dues'],
    queryFn: reportApi.getUpcomingDues,
    enabled: !isOwner,
  });

  // Use company stats for owner, branch stats for others
  const stats = isOwner ? companyReport?.company_stats : branchReport?.stats;

  const statCards = [
    {
      title: 'Total Borrowers',
      value: stats?.total_borrowers || 0,
      icon: UserGroupIcon,
      color: 'primary',
      link: '/borrowers',
    },
    {
      title: 'Total Outstanding',
      value: `₹${((stats?.total_outstanding || 0) / 100000).toFixed(1)}L`,
      icon: CurrencyRupeeIcon,
      color: 'warning',
    },
    {
      title: 'Collections (Period)',
      value: `₹${((stats?.collections_period || 0) / 100000).toFixed(1)}L`,
      icon: ChartBarIcon,
      color: 'success',
    },
    {
      title: 'Overdue',
      value: isOwner ? (stats?.total_overdue || 0) : (stats?.overdue_count || 0),
      icon: ExclamationTriangleIcon,
      color: 'danger',
      link: '/reports',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's your overview</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="glass-card p-6 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${stat.color}/10 rounded-lg border border-${stat.color}/20`}>
                  <Icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">{stat.title}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-slate-100 mono-number">
                {stat.value}
              </p>
            </div>
          );

          return stat.link ? (
            <Link key={stat.title} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/borrowers/add"
            className="p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <PlusIcon className="w-8 h-8 text-zinc-500 group-hover:text-primary mx-auto mb-2 transition-colors" />
            <p className="font-medium text-slate-300 group-hover:text-primary transition-colors">
              Add New Borrower
            </p>
          </Link>
          
          <Link
            to="/borrowers"
            className="p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <UserGroupIcon className="w-8 h-8 text-zinc-500 group-hover:text-primary mx-auto mb-2 transition-colors" />
            <p className="font-medium text-slate-300 group-hover:text-primary transition-colors">
              View All Borrowers
            </p>
          </Link>
          
          <Link
            to="/payments"
            className="p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <CurrencyRupeeIcon className="w-8 h-8 text-zinc-500 group-hover:text-primary mx-auto mb-2 transition-colors" />
            <p className="font-medium text-slate-300 group-hover:text-primary transition-colors">
              Payment History
            </p>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Borrowers */}
        {overdueBorrowers && overdueBorrowers.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                Overdue Payments
              </h2>
              <Link to="/reports" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {overdueBorrowers.slice(0, 5).map((borrower) => (
                <Link
                  key={borrower.borrower_id}
                  to={`/borrowers/${borrower.borrower_id}`}
                  className="block p-3 bg-danger/10 border border-danger/20 rounded-lg hover:bg-danger/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-100">{borrower.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{borrower.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-danger mono-number">
                        ₹{borrower.monthly_emi.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {borrower.days_overdue} days overdue
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Dues */}
        {upcomingDues && upcomingDues.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-warning" />
                Upcoming Dues (3 Days)
              </h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {upcomingDues.slice(0, 5).map((due) => (
                <Link
                  key={due.borrower_id}
                  to={`/borrowers/${due.borrower_id}`}
                  className="block p-3 bg-warning/10 border border-warning/20 rounded-lg hover:bg-warning/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-100">{due.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{due.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-warning mono-number">
                        ₹{due.monthly_emi.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {due.days_until_due === 0 ? 'Due today' : `Due in ${due.days_until_due} days`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;
