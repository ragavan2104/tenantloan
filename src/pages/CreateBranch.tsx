import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi, CreateBranchRequest } from '../api/branchApi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CreateBranch = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateBranchRequest>({
    name: '',
    location: '',
    address: '',
  });

  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: branchApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      navigate('/branches');
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create branch');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/branches" className="p-2 hover:bg-surface-gray-light rounded-lg">
          <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Create Branch</h1>
          <p className="text-slate-400 mt-1">Add a new branch to your company</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-600 rounded-lg">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Branch Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="e.g., Chennai Branch"
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
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="input-field"
            placeholder="e.g., Chennai, Tamil Nadu"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Full Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="input-field min-h-[100px]"
            placeholder="Complete address with pincode"
            required
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-zinc-800">
          <Link to="/branches" className="btn-secondary text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBranch;
