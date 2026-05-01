import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { borrowerApi } from '../api/borrowerApi';
import { userApi } from '../api/userApi';
import { branchApi } from '../api/branchApi';
import { paymentApi } from '../api/paymentApi';
import { CheckCircleIcon, XCircleIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface WorkerStats {
  workerId: string;
  workerName: string;
  totalBorrowers: number;
  totalOutstanding: number;
  collected: number;
  pending: number;
  collectedAmount: number;
  pendingAmount: number;
  borrowers: Array<{
    id: string;
    name: string;
    phone: string;
    outstanding: number;
    monthlyEmi: number;
    hasPaymentToday: boolean;
    todayCollection: number;
    lastPaymentDate: string | null;
  }>;
}

const AssignmentDetails = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Fetch branches (for owner)
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
    enabled: user?.role === 'owner',
  });
  
  // Get first active branch or user's branch
  const getDefaultBranch = () => {
    if (user?.role === 'owner' && branches && branches.length > 0) {
      const activeBranch = branches.find(b => b.status === 'active');
      return activeBranch?.id || user?.branchId || '';
    }
    return user?.branchId || '';
  };
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  // Set default branch when branches load
  if (selectedBranch === '' && branches && branches.length > 0) {
    setSelectedBranch(getDefaultBranch());
  }
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  // Fetch borrowers
  const { data: borrowers, isLoading: loadingBorrowers } = useQuery({
    queryKey: ['borrowers', selectedBranch],
    queryFn: () => borrowerApi.getAll(100, 0, undefined, selectedBranch || undefined),
    enabled: !!selectedBranch,
  });

  // Fetch all users
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: userApi.getAll,
  });

  // Fetch payments for today
  const { data: todayPayments } = useQuery({
    queryKey: ['payments-today', selectedBranch],
    queryFn: async () => {
      return paymentApi.getAll(100, 0, undefined, undefined, undefined, undefined, selectedBranch || undefined);
    },
    enabled: !!selectedBranch,
  });

  // Filter workers for selected branch
  const workers = allUsers?.filter(u => 
    u.role === 'worker' && u.branch_id === selectedBranch
  ) || [];

  // Calculate worker stats
  const workerStats: WorkerStats[] = workers.map(worker => {
    const workerBorrowers = borrowers?.filter(b => b.assigned_to === worker.id) || [];
    const totalOutstanding = workerBorrowers.reduce((sum, b) => sum + (b.outstanding_balance || 0), 0);
    
    const borrowersWithPaymentStatus = workerBorrowers.map(borrower => {
      const borrowerPayments = todayPayments?.filter(p => p.borrower_id === borrower.id) || [];
      const hasPaymentToday = borrowerPayments.length > 0;
      const todayCollection = borrowerPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Get last payment date
      const allBorrowerPayments = todayPayments?.filter(p => p.borrower_id === borrower.id) || [];
      const lastPayment = allBorrowerPayments.sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )[0];

      return {
        id: borrower.id,
        name: borrower.name,
        phone: borrower.phone,
        outstanding: borrower.outstanding_balance,
        monthlyEmi: borrower.monthly_emi,
        hasPaymentToday,
        todayCollection,
        lastPaymentDate: lastPayment?.payment_date || null,
      };
    });

    const collected = borrowersWithPaymentStatus.filter(b => b.hasPaymentToday).length;
    const pending = borrowersWithPaymentStatus.length - collected;
    const collectedAmount = borrowersWithPaymentStatus.reduce((sum, b) => sum + b.todayCollection, 0);
    const pendingAmount = borrowersWithPaymentStatus
      .filter(b => !b.hasPaymentToday)
      .reduce((sum, b) => sum + (b.monthlyEmi || 0), 0);

    return {
      workerId: worker.id,
      workerName: worker.name,
      totalBorrowers: workerBorrowers.length,
      totalOutstanding,
      collected,
      pending,
      collectedAmount,
      pendingAmount,
      borrowers: borrowersWithPaymentStatus,
    };
  });

  // Filter by selected worker
  const filteredStats = selectedWorker === 'all' 
    ? workerStats 
    : workerStats.filter(s => s.workerId === selectedWorker);

  if (loadingBorrowers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserGroupIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Assignment Details</h1>
          <p className="text-slate-400 mt-1">Track collection status by worker</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Filter (Owner only) */}
          {user?.role === 'owner' && branches && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSelectedWorker('all');
                }}
                className="input-field w-full"
              >
                <option value="">All Branches</option>
                {branches.filter(b => b.status === 'active').map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Worker Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Worker</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Workers</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Workers</p>
          <p className="text-2xl font-bold text-slate-100">{filteredStats.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Borrowers</p>
          <p className="text-2xl font-bold text-slate-100">
            {filteredStats.reduce((sum, s) => sum + s.totalBorrowers, 0)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Collected Today</p>
          <p className="text-xl font-bold text-success">
            {filteredStats.reduce((sum, s) => sum + s.collected, 0)} borrowers
          </p>
          <p className="text-sm text-success mono-number mt-1">
            ₹{filteredStats.reduce((sum, s) => sum + s.collectedAmount, 0).toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Pending Today</p>
          <p className="text-xl font-bold text-warning">
            {filteredStats.reduce((sum, s) => sum + s.pending, 0)} borrowers
          </p>
          <p className="text-sm text-warning mono-number mt-1">
            ₹{filteredStats.reduce((sum, s) => sum + s.pendingAmount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Worker Details */}
      <div className="space-y-4">
        {filteredStats.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <UserGroupIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Assignments Found</h3>
            <p className="text-slate-500">Assign borrowers to workers to see details here</p>
          </div>
        ) : (
          filteredStats.map((stat) => (
            <div key={stat.workerId} className="glass-card p-6">
              {/* Worker Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-700">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{stat.workerName}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {stat.totalBorrowers} borrowers • ₹{stat.totalOutstanding.toLocaleString()} outstanding
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{stat.collected}</p>
                    <p className="text-xs text-slate-400">Collected</p>
                    <p className="text-sm text-success mono-number mt-1">
                      ₹{stat.collectedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{stat.pending}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                    <p className="text-sm text-warning mono-number mt-1">
                      ₹{stat.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Borrower List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stat.borrowers.map((borrower) => (
                  <div
                    key={borrower.id}
                    className={`p-4 rounded-lg border ${
                      borrower.hasPaymentToday
                        ? 'bg-success/10 border-success/30'
                        : 'bg-zinc-800/50 border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-100 text-sm">{borrower.name}</p>
                        <p className="text-xs text-slate-400">{borrower.phone}</p>
                      </div>
                      {borrower.hasPaymentToday ? (
                        <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                      )}
                    </div>
                    {borrower.hasPaymentToday ? (
                      <p className="text-xs text-success font-semibold mono-number">
                        Collected: ₹{borrower.todayCollection.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-warning font-semibold mono-number">
                        Pending: ₹{borrower.monthlyEmi.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Outstanding: ₹{borrower.outstanding.toLocaleString()}
                    </p>
                    {borrower.lastPaymentDate && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        Last: {new Date(borrower.lastPaymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentDetails;
