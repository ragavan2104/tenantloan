import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { borrowerApi } from '../api/borrowerApi';
import { userApi } from '../api/userApi';
import { assignmentApi } from '../api/assignmentApi';
import { branchApi } from '../api/branchApi';
import { UserGroupIcon, UserIcon, FunnelIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const BorrowerAssignments = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showAutoSplitDialog, setShowAutoSplitDialog] = useState(false);
  const [splitBranch, setSplitBranch] = useState<string>('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  
  // Set default branch when branches load
  if (selectedBranch === '' && branches && branches.length > 0) {
    const defaultBranch = getDefaultBranch();
    setSelectedBranch(defaultBranch);
    setSplitBranch(defaultBranch);
  }

  // Fetch borrowers
  const { data: borrowers, isLoading: loadingBorrowers } = useQuery({
    queryKey: ['borrowers', selectedBranch],
    queryFn: () => borrowerApi.getAll(100, 0, undefined, selectedBranch || undefined),
    enabled: !!selectedBranch,
  });

  // Fetch workers in the branch
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: userApi.getAll,
  });

  // Filter workers for selected branch
  const workers = allUsers?.filter(u => 
    u.role === 'worker' && u.branch_id === selectedBranch
  ) || [];

  // Filter workers for split dialog
  const splitWorkers = allUsers?.filter(u => 
    u.role === 'worker' && u.branch_id === splitBranch
  ) || [];

  // Fetch borrowers for split dialog
  const { data: splitBorrowers } = useQuery({
    queryKey: ['borrowers', splitBranch],
    queryFn: () => borrowerApi.getAll(100, 0, undefined, splitBranch || undefined),
    enabled: showAutoSplitDialog && !!splitBranch,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ borrowerId, workerId }: { borrowerId: string; workerId: string | null }) =>
      assignmentApi.assignBorrower(borrowerId, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
    },
  });

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: assignmentApi.bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      setShowAutoSplitDialog(false);
      navigate('/assignment-details');
    },
  });

  // Auto-split borrowers evenly among selected workers
  const handleAutoSplit = () => {
    setShowAutoSplitDialog(true);
    setSplitBranch(selectedBranch);
    setSelectedWorkers([]);
  };

  const handleConfirmSplit = () => {
    if (!splitBorrowers || selectedWorkers.length === 0) return;

    const workersToUse = selectedWorkers.length > 0 
      ? splitWorkers.filter(w => selectedWorkers.includes(w.id))
      : splitWorkers;

    if (workersToUse.length === 0) {
      alert('Please select at least one worker');
      return;
    }

    const assignments: Array<{ borrower_id: string; worker_id: string }> = [];
    const borrowersPerWorker = Math.ceil(splitBorrowers.length / workersToUse.length);

    splitBorrowers.forEach((borrower, index) => {
      const workerIndex = Math.floor(index / borrowersPerWorker) % workersToUse.length;
      assignments.push({
        borrower_id: borrower.id,
        worker_id: workersToUse[workerIndex].id,
      });
    });

    bulkAssignMutation.mutate(assignments);
  };

  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // Clear all assignments
  const handleClearAll = () => {
    if (!borrowers) return;

    if (!confirm('This will remove all borrower assignments. Continue?')) {
      return;
    }

    const assignments = borrowers.map(b => ({
      borrower_id: b.id,
      worker_id: null,
    }));

    bulkAssignMutation.mutate(assignments);
  };

  // Filter borrowers
  const filteredBorrowers = borrowers?.filter(b => {
    const matchesSearch = searchTerm === '' || 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm);
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'assigned' && b.assigned_to) ||
      (filterStatus === 'unassigned' && !b.assigned_to);

    return matchesSearch && matchesFilter;
  }) || [];

  // Group borrowers by assignment
  const unassignedBorrowers = filteredBorrowers.filter(b => !b.assigned_to);
  const workerAssignments = workers.map(worker => ({
    worker,
    borrowers: filteredBorrowers.filter(b => b.assigned_to === worker.id),
  }));

  if (loadingBorrowers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl mx-auto">
      {/* Auto Split Dialog */}
      {showAutoSplitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="section-label mb-2">Automation</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Auto Split Borrowers</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Split borrowers evenly across selected workers in the current branch.
                </p>
              </div>
              <button
                onClick={() => setShowAutoSplitDialog(false)}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Branch Selection */}
            {user?.role === 'owner' && branches && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Branch
                </label>
                <select
                  value={splitBranch}
                  onChange={(e) => {
                    setSplitBranch(e.target.value);
                    setSelectedWorkers([]);
                  }}
                  className="input-field w-full"
                >
                  {branches.filter(b => b.status === 'active').map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Worker Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Workers ({selectedWorkers.length} selected)
              </label>
              <div className="grid gap-3 max-h-72 overflow-y-auto pr-1 sm:grid-cols-2">
                {splitWorkers.length === 0 ? (
                  <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-slate-400">
                    No workers in this branch
                  </p>
                ) : (
                  splitWorkers.map((worker) => (
                    <label
                      key={worker.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={() => toggleWorkerSelection(worker.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{worker.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{worker.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <button
                onClick={() => setSelectedWorkers(splitWorkers.map(w => w.id))}
                className="mt-3 text-sm font-medium text-primary hover:text-indigo-600"
              >
                Select All
              </button>
            </div>

            {/* Summary */}
            {splitBorrowers && selectedWorkers.length > 0 && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{splitBorrowers.length}</span> borrowers will be split among{' '}
                  <span className="font-semibold">{selectedWorkers.length}</span> workers
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ~{Math.ceil(splitBorrowers.length / selectedWorkers.length)} borrowers per worker
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAutoSplitDialog(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSplit}
                disabled={selectedWorkers.length === 0 || bulkAssignMutation.isPending}
                className="btn-primary flex-1"
              >
                {bulkAssignMutation.isPending ? 'Splitting...' : 'Confirm Split'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="surface-card overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <UserGroupIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="section-label mb-2">Workflow</p>
              <h1 className="page-title">Borrower Assignments</h1>
              <p className="page-subtitle max-w-2xl">
                Assign borrowers to workers, filter the board, or split the workload automatically when you need a fast redistribution.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Active branch</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {branches?.find(b => b.id === selectedBranch)?.name || 'Select a branch'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{workers.length} workers available</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm dark:bg-primary/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleAutoSplit}
                  disabled={workers.length === 0 || bulkAssignMutation.isPending}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Auto Split</span>
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={bulkAssignMutation.isPending}
                  className="btn-secondary"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="section-label mb-2">Total borrowers</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{filteredBorrowers.length}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Visible after branch and search filters</p>
        </div>
        <div className="metric-card">
          <p className="section-label mb-2">Assigned</p>
          <p className="text-3xl font-bold text-success">{filteredBorrowers.filter(b => b.assigned_to).length}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Borrowers already mapped to workers</p>
        </div>
        <div className="metric-card">
          <p className="section-label mb-2">Unassigned</p>
          <p className="text-3xl font-bold text-warning">{unassignedBorrowers.length}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ready for manual assignment</p>
        </div>
      </div>

      {/* Filters */}
      <div className="page-card">
        <div className="mb-4 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Branch Filter (Owner only) */}
          {user?.role === 'owner' && branches && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Branches</option>
                {branches.filter(b => b.status === 'active').map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or phone..."
              className="input-field w-full"
            />
          </div>

          {/* Filter Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field w-full"
            >
              <option value="all">All Borrowers</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Unassigned Column */}
        <div className="surface-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unassigned ({unassignedBorrowers.length})
            </h3>
            <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
              Needs action
            </span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {unassignedBorrowers.map((borrower) => (
              <div
                key={borrower.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{borrower.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{borrower.phone}</p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    Unassigned
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-warning">
                  ₹{borrower.outstanding_balance?.toLocaleString() || 'N/A'} outstanding
                </p>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignMutation.mutate({
                        borrowerId: borrower.id,
                        workerId: e.target.value,
                      });
                    }
                  }}
                  className="input-field mt-3 w-full text-sm"
                  defaultValue=""
                >
                  <option value="">Assign to...</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {unassignedBorrowers.length === 0 && (
              <p className="text-center text-slate-500 py-8">No unassigned borrowers</p>
            )}
          </div>
        </div>

        {/* Worker Columns */}
        {workerAssignments.map(({ worker, borrowers: workerBorrowers }) => (
          <div key={worker.id} className="surface-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{worker.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{workerBorrowers.length} borrowers assigned</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {workerBorrowers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {workerBorrowers.map((borrower) => (
                <div
                  key={borrower.id}
                  className="rounded-2xl border border-primary/15 bg-primary/5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{borrower.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{borrower.phone}</p>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                      Assigned
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-warning">
                    ₹{borrower.outstanding_balance?.toLocaleString() || 'N/A'} outstanding
                  </p>
                  <button
                    onClick={() => {
                      assignMutation.mutate({
                        borrowerId: borrower.id,
                        workerId: null,
                      });
                    }}
                    className="mt-3 text-xs font-semibold text-danger hover:text-rose-700 hover:underline"
                  >
                    Unassign
                  </button>
                </div>
              ))}
              {workerBorrowers.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-slate-400">
                  No assigned borrowers
                </p>
              )}
            </div>
          </div>
        ))}

        {workers.length === 0 && (
          <div className="lg:col-span-2 surface-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-300">
              <UserIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Workers Found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Add workers to this branch to start assigning borrowers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowerAssignments;
