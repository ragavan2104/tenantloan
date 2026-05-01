import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { loanApi, AddLoanRequest } from '../api/loanApi';
import { companyApi } from '../api/companyApi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const AddAdditionalLoan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<AddLoanRequest>({
    loan_amount: 0,
    tenure_months: 12,
    start_date: new Date().toISOString().split('T')[0],
  });

  const [emiPreview, setEmiPreview] = useState<any>(null);
  const [error, setError] = useState('');

  // Get existing borrower data
  const { data: borrower, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower', id],
    queryFn: () => borrowerApi.getById(id!),
    enabled: !!id,
  });

  // Get existing loans
  const { data: loanSummary } = useQuery({
    queryKey: ['borrower-loans', id],
    queryFn: () => loanApi.getBorrowerLoans(id!),
    enabled: !!id,
  });

  // Get company settings
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  // Calculate new loan EMI preview
  useEffect(() => {
    if (formData.loan_amount > 0 && formData.tenure_months > 0 && companySettings?.settings) {
      loanApi.calculate({
        principal: formData.loan_amount,
        interest_rate: companySettings.settings.interest_rate,
        interest_type: companySettings.settings.interest_type,
        tenure_months: formData.tenure_months,
      }).then(setEmiPreview).catch(console.error);
    }
  }, [formData.loan_amount, formData.tenure_months, companySettings]);

  const addLoanMutation = useMutation({
    mutationFn: (data: AddLoanRequest) => loanApi.addLoan(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans', id] });
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      navigate(`/borrowers/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to add loan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    addLoanMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  if (borrowerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!borrower) {
    return <div className="text-center text-slate-400">Borrower not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={`/borrowers/${id}`} className="p-2 hover:bg-surface-gray-light rounded-lg">
          <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Add Additional Loan</h1>
          <p className="text-slate-400 mt-1">Add a new loan to {borrower.name}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-600 rounded-lg">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      {/* Current Loans Summary */}
      {loanSummary && loanSummary.loans.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Existing Loans</h2>
          <div className="space-y-3">
            {loanSummary.loans.map((loan) => (
              <div key={loan.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Loan #{loan.loan_number}</h3>
                    <p className="text-xs text-slate-500">
                      Started: {new Date(loan.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    loan.loan_status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {loan.loan_status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">EMI</p>
                    <p className="text-sm font-semibold text-slate-100 mono-number">
                      ₹{loan.monthly_emi.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Outstanding</p>
                    <p className="text-sm font-semibold text-warning mono-number">
                      ₹{loan.outstanding_balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-sm font-semibold text-success mono-number">
                      ₹{loan.amount_paid.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Monthly EMI</p>
              <p className="text-lg font-bold text-primary mono-number">
                ₹{loanSummary.total_monthly_emi.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Outstanding</p>
              <p className="text-lg font-bold text-warning mono-number">
                ₹{loanSummary.total_outstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Additional Loan Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="50000"
                  min="1000"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tenure (Months) *
                </label>
                <input
                  type="number"
                  name="tenure_months"
                  value={formData.tenure_months}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12"
                  min="1"
                  max="360"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              {companySettings?.settings && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interest Rate
                    </label>
                    <input
                      type="text"
                      value={`${companySettings.settings.interest_rate}% per annum`}
                      className="input-field"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interest Type
                    </label>
                    <input
                      type="text"
                      value={companySettings.settings.interest_type}
                      className="input-field capitalize"
                      disabled
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Note:</span> This will create a separate loan (Loan #{(loanSummary?.total_loans || 0) + 1}). 
              Each loan will have its own EMI schedule and can be managed independently.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-zinc-800">
            <Link to={`/borrowers/${id}`} className="btn-secondary text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={addLoanMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {addLoanMutation.isPending ? 'Adding Loan...' : 'Add Additional Loan'}
            </button>
          </div>
        </form>

        {/* New Loan Preview */}
        <div className="glass-card p-6 h-fit sticky top-24">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">New Loan Preview</h3>
          
          {emiPreview ? (
            <div className="space-y-4">
              {/* New Loan EMI */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Monthly EMI</p>
                <p className="text-2xl font-bold text-primary mono-number">
                  ₹{emiPreview.monthly_emi.toLocaleString()}
                </p>
              </div>

              {/* Loan Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Principal</span>
                  <span className="text-sm font-semibold text-slate-100 mono-number">
                    ₹{emiPreview.principal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Total Interest</span>
                  <span className="text-sm font-semibold text-warning mono-number">
                    ₹{emiPreview.total_interest.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-zinc-800">
                  <span className="text-sm font-medium text-slate-300">Total Payable</span>
                  <span className="text-lg font-bold text-slate-100 mono-number">
                    ₹{emiPreview.total_payable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Combined Summary */}
              {loanSummary && loanSummary.active_loans > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">After Adding This Loan</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Monthly EMI</span>
                      <span className="text-primary font-semibold mono-number">
                        ₹{(loanSummary.total_monthly_emi + emiPreview.monthly_emi).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Outstanding</span>
                      <span className="text-warning font-semibold mono-number">
                        ₹{(loanSummary.total_outstanding + emiPreview.total_payable).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Active Loans</span>
                      <span className="text-slate-100 font-semibold">
                        {loanSummary.active_loans + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Enter loan amount and tenure to see preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAdditionalLoan;
