import { Borrower } from '../api/borrowerApi';
import { PhoneIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface BorrowerCardProps {
  borrower: Borrower;
}

const BorrowerCard = ({ borrower }: BorrowerCardProps) => {
  const getStatusColor = (status?: string) => {
    if (!status) return 'badge-secondary';
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-info';
      case 'defaulted':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const isOverdue = borrower.next_due_date && new Date(borrower.next_due_date) < new Date();

  return (
    <div className="glass-card p-4 sm:p-6 hover:border-primary/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{borrower.name}</h3>
          <div className="flex flex-wrap gap-2">
            {borrower.loan_status && (
              <span className={`${getStatusColor(borrower.loan_status)} capitalize`}>
                {borrower.loan_status}
              </span>
            )}
            {isOverdue && (
              <span className="badge-danger">Overdue</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/borrowers/${borrower.id}`}
            className="btn-primary text-sm px-4 py-2 text-center"
          >
            View Details
          </Link>
          {borrower.loan_status === 'active' && (
            <Link
              to={`/borrowers/${borrower.id}/add-loan`}
              className="btn-secondary text-sm px-3 py-2 text-center flex items-center gap-1"
              title="Add Additional Loan"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Loan</span>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <PhoneIcon className="w-4 h-4" />
          <span>{borrower.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPinIcon className="w-4 h-4" />
          <span className="truncate">{borrower.address}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800">
        <div>
          <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
          <p className="text-sm font-semibold text-slate-100 mono-number">
            ₹{borrower.loan_amount?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
          <p className="text-sm font-semibold text-slate-100 mono-number">
            ₹{borrower.monthly_emi?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className="text-sm font-semibold text-warning mono-number">
            ₹{borrower.outstanding_balance?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Next Due</p>
          <p className={`text-sm font-semibold ${isOverdue ? 'text-danger' : 'text-slate-100'}`}>
            {borrower.next_due_date ? new Date(borrower.next_due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BorrowerCard;
