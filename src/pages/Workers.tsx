import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, CreateUserRequest, User } from '../api/userApi';
import { PlusIcon, EnvelopeIcon, PhoneIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Workers = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    phone: '',
  });

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: userApi.getBranchWorkers,
  });

  const createMutation = useMutation({
    mutationFn: userApi.createBranchWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowModal(false);
      resetForm();
      alert('Worker created successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.updateBranchWorker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowModal(false);
      resetForm();
      alert('Worker updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.deleteBranchWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      alert('Worker deleted successfully!');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      userApi.updateBranchWorker(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '' });
    setEditingWorker(null);
  };

  const handleEdit = (worker: User) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      email: worker.email,
      phone: worker.phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      updateMutation.mutate({ id: editingWorker.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
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
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Workers</h1>
            <p className="text-slate-400 mt-1">Manage branch workers and their access</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Worker</span>
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers?.map((worker) => (
          <div key={worker.id} className="glass-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-1">{worker.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  worker.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {worker.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(worker)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => handleDelete(worker.id, worker.name)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{worker.email}</span>
              </div>
              {worker.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{worker.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Active Status</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={worker.is_active}
                    onChange={(e) => toggleActiveMutation.mutate({ id: worker.id, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {workers?.length === 0 && (
        <div className="glass-card p-12 text-center">
          <UserCircleIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Workers Yet</h3>
          <p className="text-slate-500 mb-6">Add your first worker to get started</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Worker</span>
          </button>
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingWorker ? 'Edit Worker' : 'Add Worker'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
                {!editingWorker && (
                  <p className="text-xs text-blue-400 mt-1">
                    A temporary password will be sent to this email
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="+91 1234567890"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingWorker
                    ? 'Update Worker'
                    : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
