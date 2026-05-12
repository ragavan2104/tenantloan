import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lockerApi, CreateLockerRequest, UpdateLockerRequest } from '../api/lockerApi';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import LoanTypeIcon from '../components/LoanTypeIcon';
import { useToast } from '../hooks/useToast';

const GoldLockers = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingLocker, setEditingLocker] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [formData, setFormData] = useState<CreateLockerRequest>({
    locker_number: '',
    location: '',
    description: '',
  });

  const { data: lockers = [], isLoading } = useQuery({
    queryKey: ['lockers', statusFilter],
    queryFn: () => lockerApi.getAll(statusFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: lockerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      toast.success('Locker created successfully!');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create locker');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLockerRequest }) =>
      lockerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      toast.success('Locker updated successfully!');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update locker');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: lockerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      toast.success('Locker deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete locker');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocker) {
      updateMutation.mutate({ id: editingLocker.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (locker: any) => {
    setEditingLocker(locker);
    setFormData({
      locker_number: locker.locker_number,
      location: locker.location,
      description: locker.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = (lockerId: string) => {
    if (window.confirm('Are you sure you want to delete this locker?')) {
      deleteMutation.mutate(lockerId);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocker(null);
    setFormData({
      locker_number: '',
      location: '',
      description: '',
    });
  };

  const availableLockers = lockers.filter(l => l.status === 'available').length;
  const occupiedLockers = lockers.filter(l => l.status === 'occupied').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Gold Lockers</h1>
            <p className="text-slate-400 mt-1">Manage gold storage lockers</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Locker
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <p className="text-sm text-slate-500 mb-2">Total Lockers</p>
          <p className="text-2xl font-bold text-slate-100">{lockers.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-slate-500 mb-2">Available</p>
          <p className="text-2xl font-bold text-success">{availableLockers}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-slate-500 mb-2">Occupied</p>
          <p className="text-2xl font-bold text-warning">{occupiedLockers}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-primary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field flex-1"
          >
            <option value="">All Lockers</option>
            <option value="available">Available Only</option>
            <option value="occupied">Occupied Only</option>
          </select>
        </div>
      </div>

      {/* Lockers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lockers.map((locker) => (
          <div
            key={locker.id}
            className={`glass-card p-6 ${
              locker.status === 'occupied' ? 'border-warning/30' : 'border-success/30'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {locker.status === 'available' ? (
                  <LockOpenIcon className="w-8 h-8 text-success" />
                ) : (
                  <LockClosedIcon className="w-8 h-8 text-warning" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {locker.locker_number}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      locker.status === 'available'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {locker.status}
                  </span>
                </div>
              </div>
              {locker.status === 'available' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(locker)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(locker.id)}
                    className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-500">Location</p>
                <p className="text-slate-200">{locker.location}</p>
              </div>
              {locker.description && (
                <div>
                  <p className="text-slate-500">Description</p>
                  <p className="text-slate-200">{locker.description}</p>
                </div>
              )}
              {locker.status === 'occupied' && (
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-slate-500">Occupied By</p>
                  <p className="text-slate-200 font-medium">{locker.occupied_by_name}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {lockers.length === 0 && (
        <div className="glass-card p-12 text-center">
          <LoanTypeIcon type="gold" size="lg" className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No lockers found</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4"
          >
            Add Your First Locker
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">
              {editingLocker ? 'Edit Locker' : 'Add New Locker'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Locker Number *
                </label>
                <input
                  type="text"
                  value={formData.locker_number}
                  onChange={(e) =>
                    setFormData({ ...formData, locker_number: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., L-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Vault A, Shelf 2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingLocker ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldLockers;
