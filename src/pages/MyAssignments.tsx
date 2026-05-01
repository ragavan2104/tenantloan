import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { paymentApi } from '../api/paymentApi';
import { CheckCircleIcon, XCircleIcon, ClockIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const MyAssignments = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | 'collected' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch borrowers assigned to this worker (backend already filters)
  const { data: allBorrowers, isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: () => borrowerApi.getAll(),
  });

  // Backend already filters for workers, so use all returned borrowers
  const myBorrowers = allBorrowers || [];

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getAll(),
  });

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Calculate payment status for each borrower
  const borrowersWithStatus = myBorrowers.map(borrower => {
    const borrowerPayments = payments?.filter(p => 
      p.borrower_id === borrower.id &&
      new Date(p.payment_date).toISOString().split('T')[0] === today
    ) || [];
    
    const hasPaymentToday = borrowerPayments.length > 0;
    const todayCollection = borrowerPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get last payment
    const allBorrowerPayments = payments?.filter(p => p.borrower_id === borrower.id) || [];
    const lastPayment = allBorrowerPayments.sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    )[0];

    return {
      ...borrower,
      hasPaymentToday,
      todayCollection,
      lastPaymentDate: lastPayment?.payment_date || null,
    };
  });

  // Filter borrowers
  const filteredBorrowers = borrowersWithStatus.filter(b => {
    const matchesSearch = searchTerm === '' || 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm);
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'collected' && b.hasPaymentToday) ||
      (filterStatus === 'pending' && !b.hasPaymentToday);

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalBorrowers = myBorrowers.length;
  const collectedToday = borrowersWithStatus.filter(b => b.hasPaymentToday).length;
  const pendingToday = totalBorrowers - collectedToday;
  // const totalOutstanding = myBorrowers.reduce((sum, b) => sum + b.outstanding_balance, 0);
  const todayCollectionAmount = borrowersWithStatus.reduce((sum, b) => sum + b.todayCollection, 0);

  if (isLoading) {
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
        <UserIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">My Assignments</h1>
          <p className="text-slate-400 mt-1">Borrowers assigned to you</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Borrowers</p>
          <p className="text-2xl font-bold text-slate-100">{totalBorrowers}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Collected Today</p>
          <p className="text-2xl font-bold text-success">{collectedToday}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Pending Today</p>
          <p className="text-2xl font-bold text-warning">{pendingToday}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Today's Collection</p>
          <p className="text-2xl font-bold text-primary">₹{todayCollectionAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field w-full"
            >
              <option value="all">All Borrowers</option>
              <option value="collected">Collected Today</option>
              <option value="pending">Pending Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Borrower List */}
      {myBorrowers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Assignments Yet</h3>
          <p className="text-slate-500">You don't have any borrowers assigned to you</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBorrowers.map((borrower) => (
            <div
              key={borrower.id}
              onClick={() => navigate(`/borrowers/${borrower.id}`)}
              className={`glass-card p-4 cursor-pointer hover:border-primary/50 transition-colors ${
                borrower.hasPaymentToday
                  ? 'border-success/30 bg-success/5'
                  : 'border-zinc-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100">{borrower.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <PhoneIcon className="w-4 h-4" />
                    {borrower.phone}
                  </p>
                </div>
                {borrower.hasPaymentToday ? (
                  <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-zinc-600 flex-shrink-0" />
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Outstanding:</span>
                  <span className="text-warning font-medium">
                    ₹{borrower.outstanding_balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Monthly EMI:</span>
                  <span className="text-slate-100 font-medium">
                    ₹{borrower.monthly_emi.toLocaleString()}
                  </span>
                </div>
                {borrower.hasPaymentToday && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Today's Collection:</span>
                    <span className="text-success font-medium">
                      ₹{borrower.todayCollection.toLocaleString()}
                    </span>
                  </div>
                )}
                {borrower.lastPaymentDate && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                    <ClockIcon className="w-3 h-3" />
                    Last payment: {new Date(borrower.lastPaymentDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-3 border-t border-zinc-700">
                {borrower.hasPaymentToday ? (
                  <span className="text-xs px-2 py-1 bg-success/20 text-success rounded-full">
                    Collected Today
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full">
                    Pending Collection
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBorrowers.length === 0 && myBorrowers.length > 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-slate-400">No borrowers match your filters</p>
        </div>
      )}
    </div>
  );
};

export default MyAssignments;
