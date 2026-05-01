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
    <div className="space-y-6">
      {/* Auto Split Dialog */}
      {showAutoSplitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Auto Split Borrowers</h2>
              <button
                onClick={() => setShowAutoSplitDialog(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Branch Selection */}
            {user?.role === 'owner' && branches && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Workers ({selectedWorkers.length} selected)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {splitWorkers.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No workers in this branch</p>
                ) : (
                  splitWorkers.map((worker) => (
                    <label
                      key={worker.id}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={() => toggleWorkerSelection(worker.id)}
                        className="w-4 h-4 text-primary bg-zinc-700 border-zinc-600 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-100">{worker.name}</p>
                        <p className="text-xs text-slate-400">{worker.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <button
                onClick={() => setSelectedWorkers(splitWorkers.map(w => w.id))}
                className="text-sm text-primary hover:underline mt-2"
              >
                Select All
              </button>
            </div>

            {/* Summary */}
            {splitBorrowers && selectedWorkers.length > 0 && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold">{splitBorrowers.length}</span> borrowers will be split among{' '}
                  <span className="font-semibold">{selectedWorkers.length}</span> workers
                </p>
                <p className="text-xs text-slate-400 mt-1">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Borrower Assignments</h1>
            <p className="text-slate-400 mt-1">Assign borrowers to workers for better management</p>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Branch Filter (Owner only) */}
          {user?.role === 'owner' && branches && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <FunnelIcon className="w-4 h-4 inline mr-1" />
              Filter
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Borrowers</p>
          <p className="text-2xl font-bold text-slate-100">{filteredBorrowers.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Assigned</p>
          <p className="text-2xl font-bold text-success">
            {filteredBorrowers.filter(b => b.assigned_to).length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Unassigned</p>
          <p className="text-2xl font-bold text-warning">{unassignedBorrowers.length}</p>
        </div>
      </div>

      {/* Assignment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Unassigned Column */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">
              Unassigned ({unassignedBorrowers.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {unassignedBorrowers.map((borrower) => (
              <div
                key={borrower.id}
                className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-slate-100 text-sm">{borrower.name}</p>
                <p className="text-xs text-slate-400">{borrower.phone}</p>
                <p className="text-xs text-warning mt-1">
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
                  className="input-field text-xs mt-2 w-full"
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
          <div key={worker.id} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-100">{worker.name}</h3>
                <p className="text-xs text-slate-400">{workerBorrowers.length} borrowers</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {workerBorrowers.map((borrower) => (
                <div
                  key={borrower.id}
                  className="p-3 bg-primary/10 rounded-lg border border-primary/30"
                >
                  <p className="font-medium text-slate-100 text-sm">{borrower.name}</p>
                  <p className="text-xs text-slate-400">{borrower.phone}</p>
                  <p className="text-xs text-warning mt-1">
                    ₹{borrower.outstanding_balance?.toLocaleString() || 'N/A'} outstanding
                  </p>
                  <button
                    onClick={() => {
                      assignMutation.mutate({
                        borrowerId: borrower.id,
                        workerId: null,
                      });
                    }}
                    className="text-xs text-danger hover:underline mt-2"
                  >
                    Unassign
                  </button>
                </div>
              ))}
              {workerBorrowers.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No assigned borrowers</p>
              )}
            </div>
          </div>
        ))}

        {workers.length === 0 && (
          <div className="col-span-2 glass-card p-12 text-center">
            <UserIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Workers Found</h3>
            <p className="text-slate-500">Add workers to this branch to start assigning borrowers</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowerAssignments;
