import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { userApi, CreateUserRequest, User } from '../api/userApi';
import { branchApi } from '../api/branchApi';
import { companyApi } from '../api/companyApi';
import { PlusIcon, EnvelopeIcon, PhoneIcon, PencilIcon, TrashIcon, UserCircleIcon, BuildingOfficeIcon, FunnelIcon } from '@heroicons/react/24/outline';

const Users = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: any) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [formData, setFormData] = useState<CreateUserRequest & { branch_id?: string; role?: string }>({
    name: '',
    email: '',
    phone: '',
    branch_id: '',
    role: 'worker',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: userApi.getAll,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.getAll,
  });

  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId),
    enabled: !!user?.companyId,
  });

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowModal(false);
      resetForm();
      alert('User created successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowModal(false);
      resetForm();
      alert('User updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      alert('User deleted successfully!');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      userApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', branch_id: '', role: 'worker' });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      branch_id: user.branch_id || '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branch_id || null,
        role: formData.role,
      };
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      const createData = {
        ...formData,
        branch_id: formData.branch_id || null,
      };
      createMutation.mutate(createData);
    }
  };

  // Filter users
  const filteredUsers = users?.filter(user => {
    const branchMatch = selectedBranch === 'all' || user.branch_id === selectedBranch;
    const roleMatch = selectedRole === 'all' || user.role === selectedRole;
    return branchMatch && roleMatch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-primary/10 text-primary';
      case 'branch_admin': return 'bg-indigo-500/10 text-indigo-400';
      case 'worker': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'branch_admin': return 'Branch Admin';
      case 'worker': return 'Worker';
      default: return role;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">All Users</h1>
            <p className="text-slate-400 mt-1">Manage users across all branches</p>
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
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-300">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="input-field"
            >
              <option value="all">All Branches</option>
              {branches?.filter(b => b.status === 'active').map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="branch_admin">Branch Admin</option>
              <option value="worker">Worker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers?.map((user) => (
          <div key={user.id} className="glass-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{user.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadge(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    user.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => handleDelete(user.id, user.name)}
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
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.branch_id && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BuildingOfficeIcon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {user.branch_id === 'parent' 
                      ? company?.name || 'Main Office'
                      : branches?.find(b => b.id === user.branch_id)?.name || 'Unknown Branch'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Active Status</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={user.is_active}
                    onChange={(e) => toggleActiveMutation.mutate({ id: user.id, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers?.length === 0 && (
        <div className="glass-card p-12 text-center">
          <UserCircleIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Users Found</h3>
          <p className="text-slate-500 mb-6">Try adjusting your filters or add a new user</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
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
                {!editingUser && (
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      // Reset branch_id if switching to branch_admin and parent was selected
                      branch_id: newRole === 'branch_admin' && formData.branch_id === 'parent' ? '' : formData.branch_id
                    });
                  }}
                  className="input-field"
                  required
                >
                  <option value="branch_admin">Branch Admin</option>
                  <option value="worker">Worker</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.role === 'branch_admin' 
                    ? 'Branch Admin manages a specific branch and its workers'
                    : 'Worker can view and manage borrowers and payments'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Branch *</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches?.filter(b => b.status === 'active').map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.role === 'branch_admin' 
                    ? 'Branch Admin must be assigned to a specific branch'
                    : 'Select the branch for this user'
                  }
                </p>
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
                    : editingUser
                    ? 'Update User'
                    : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
