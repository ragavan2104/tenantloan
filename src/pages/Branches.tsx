import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, Branch, CreateBranchRequest } from '../api/branchApi';
import { companyApi } from '../api/companyApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PlusIcon, MapPinIcon, ExclamationCircleIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Branches = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<CreateBranchRequest>({
    name: '',
    location: '',
    address: '',
  });
  
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
  });

  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBranchRequest> }) =>
      branchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowEditModal(false);
      setEditingBranch(null);
      alert('Branch updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: branchApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('Branch deleted successfully!');
    },
  });

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      address: branch.address,
    });
    setShowEditModal(true);
  };

  const handleDelete = (branch: Branch) => {
    if (window.confirm(`Are you sure you want to delete "${branch.name}"? This will delete all borrowers, loans, and payments associated with this branch. This action cannot be undone.`)) {
      deleteMutation.mutate(branch.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: formData });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending_approval': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const activeBranches = branches?.filter(b => b.status === 'active').length || 0;
  const branchLimit = company?.subscription?.branch_limit || 3;
  const canCreateBranch = activeBranches < branchLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Branches</h1>
            <p className="text-slate-400 mt-1">
              Manage all company branches ({activeBranches}/{branchLimit} active)
            </p>
          </div>
        </div>
        {canCreateBranch ? (
          <Link to="/branches/create" className="btn-primary flex items-center gap-2 justify-center">
            <PlusIcon className="w-5 h-5" />
            <span>Create Branch</span>
          </Link>
        ) : (
          <button
            disabled
            className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2 justify-center"
            title="Branch limit reached"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Limit Reached</span>
          </button>
        )}
      </div>

      {!canCreateBranch && (
        <div className="glass-card p-4 border-l-4 border-warning">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Branch Limit Reached</h3>
              <p className="text-sm text-slate-400">
                You have reached the maximum number of branches ({branchLimit}). 
                Contact SuperAdmin to increase your branch limit.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {branches?.map((branch) => (
          <div key={branch.id} className="glass-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{branch.name}</h3>
                <span className={`${getStatusColor(branch.status)} capitalize`}>
                  {branch.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(branch)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit Branch"
                >
                  <PencilIcon className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => handleDelete(branch)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Delete Branch"
                  disabled={branch.status === 'pending_approval'}
                >
                  <TrashIcon className={`w-4 h-4 ${branch.status === 'pending_approval' ? 'text-zinc-600' : 'text-danger'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPinIcon className="w-4 h-4" />
                <span>{branch.location}</span>
              </div>
              {branch.address && (
                <p className="text-xs text-slate-500 pl-6">{branch.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <div>
                <p className="text-xs text-slate-500">Borrowers</p>
                <p className="text-lg font-semibold text-slate-100">{branch.stats.total_borrowers}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="text-lg font-semibold text-warning mono-number">
                  ₹{(branch.stats.total_outstanding / 100000).toFixed(1)}L
                </p>
              </div>
            </div>

            {branch.status === 'pending_approval' && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-slate-400">
                  Waiting for SuperAdmin approval
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {branches?.length === 0 && (
        <div className="glass-card p-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Branches Yet</h3>
          <p className="text-slate-500 mb-6">Create your first branch to get started</p>
          <Link to="/branches/create" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            <span>Create Branch</span>
          </Link>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Edit Branch</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                  placeholder="City, State"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Full branch address"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBranch(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
