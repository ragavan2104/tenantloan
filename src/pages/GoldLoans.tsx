import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoanTypeIcon from '../components/LoanTypeIcon';

const GoldLoans = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allBorrowers, isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: () => borrowerApi.getAll(100, 0),
  });

  // Filter only gold loans
  const goldLoans = allBorrowers?.filter((borrower: any) => borrower.loan_type === 'gold') || [];

  // Filter by search
  const filteredLoans = goldLoans.filter((loan: any) =>
    loan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.phone.includes(searchQuery)
  );

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
            <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
            Gold Loans
          </h1>
          <p className="text-slate-400 mt-1">Manage all gold loans with bullet repayment</p>
        </div>
        <Link
          to="/borrowers/add-gold-loan"
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 justify-center font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Gold Loan</span>
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Total Gold Loans</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{goldLoans.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Active Loans</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {goldLoans.filter((l: any) => l.loan_status === 'active').length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">Total Outstanding</div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">
            ₹{goldLoans.reduce((sum: number, l: any) => sum + (l.outstanding_balance || 0), 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Gold Loans List */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Borrower</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Gold Details</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Loan Amount</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Outstanding</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Locker</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    {searchQuery ? 'No gold loans found matching your search' : 'No gold loans yet'}
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan: any) => {
                  const collateral = loan.collateral || {};
                  const goldItems = collateral.gold_items || [];
                  const totalWeight = collateral.total_gold_weight || 0;
                  const goldValue = collateral.gold_value || 0;
                  
                  return (
                    <tr key={loan.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-slate-100">{loan.name}</div>
                          <div className="text-sm text-slate-400">{loan.phone}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="text-slate-300">{totalWeight}g gold</div>
                          <div className="text-slate-400">{goldItems.length} item(s)</div>
                          <div className="text-yellow-500">₹{goldValue.toLocaleString('en-IN')}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">
                          ₹{(loan.loan_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-400">
                          {loan.tenure_months} months
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-yellow-500">
                          ₹{(loan.outstanding_balance || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-400">
                          Paid: ₹{(loan.amount_paid || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="text-slate-300">{collateral.locker_number || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{collateral.storage_location || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          loan.loan_status === 'active'
                            ? 'bg-green-500/10 text-green-500'
                            : loan.loan_status === 'completed'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {loan.loan_status || 'active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/gold-loans/${loan.id}`}
                            className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            View
                          </Link>
                          {loan.loan_status === 'active' && (
                            <Link
                              to={`/gold-loans/${loan.id}/pay`}
                              className="px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                            >
                              Pay
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoldLoans;
