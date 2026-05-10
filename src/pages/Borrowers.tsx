import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { branchApi } from '../api/branchApi';
import BorrowerCard from '../components/BorrowerCard';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Borrowers = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loanStatus, setLoanStatus] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get branches for filter (owner only)
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getAll(),
    enabled: user?.role === 'owner',
  });

  const { data: borrowers, isLoading } = useQuery({
    queryKey: ['borrowers', loanStatus, branchFilter, debouncedSearch],
    queryFn: () => borrowerApi.getAll(100, 0, loanStatus, branchFilter, debouncedSearch),
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setLoanStatus('');
    setBranchFilter('');
  };

  const hasActiveFilters = searchQuery || loanStatus || branchFilter;

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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Borrowers</h1>
          <p className="text-slate-400 mt-1">Manage all borrowers and their loans</p>
        </div>
        <Link
          to="/borrowers/add"
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Borrower</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by name or phone number..."
          />
          {searchQuery && searchQuery !== debouncedSearch && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-primary transition-colors"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            {/* Loan Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan Status
              </label>
              <select
                value={loanStatus}
                onChange={(e) => setLoanStatus(e.target.value)}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Branch Filter (Owner only) */}
            {user?.role === 'owner' && branches && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Branch
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Branches</option>
                  {branches.filter(b => b.status === 'active').map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {borrowers && (
        <div className="text-sm text-slate-400">
          Showing {borrowers.length} borrower{borrowers.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </div>
      )}

      {/* Borrowers Grid */}
      {borrowers && borrowers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 mb-4">
            {hasActiveFilters ? 'No borrowers found matching your filters' : 'No borrowers yet'}
          </p>
          {hasActiveFilters ? (
            <button onClick={handleClearFilters} className="btn-secondary">
              Clear Filters
            </button>
          ) : (
            <Link to="/borrowers/add" className="btn-primary inline-flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              <span>Add First Borrower</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {borrowers?.map((borrower) => (
            <BorrowerCard key={borrower.id} borrower={borrower} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Borrowers;
