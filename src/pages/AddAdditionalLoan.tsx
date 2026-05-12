import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';
import { loanApi, AddLoanRequest } from '../api/loanApi';
import { companyApi } from '../api/companyApi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoanTypeIcon from '../components/LoanTypeIcon';

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

  const [loanType, setLoanType] = useState<'personal' | 'bike' | 'car'>('personal');
  const [emiPreview, setEmiPreview] = useState<any>(null);
  const [error, setError] = useState('');

  // Vehicle loan specific states
  const [vehicleMake, setVehicleMake] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [rcBookNumber, setRcBookNumber] = useState<string>('');
  const [yearOfManufacture, setYearOfManufacture] = useState<string>('');

  const formatCurrency = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    return (Number.isFinite(numeric) ? numeric : 0).toLocaleString('en-IN');
  };

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
      // Get loan type specific settings
      const loanTypeSettings = (companySettings.settings as any).loan_type_settings?.[loanType];
      const interestRate = loanTypeSettings?.interest_rate || companySettings.settings.interest_rate || 12;
      const interestType = loanTypeSettings?.interest_type || companySettings.settings.interest_type || 'flat';
      
      loanApi.calculate({
        principal: formData.loan_amount,
        interest_rate: interestRate,
        interest_type: interestType,
        tenure_months: formData.tenure_months,
      }).then(setEmiPreview).catch(console.error);
    }
  }, [formData.loan_amount, formData.tenure_months, companySettings, loanType]);

  const addLoanMutation = useMutation({
    mutationFn: (data: AddLoanRequest) => loanApi.addLoan(id!, data),
    onSuccess: (newLoan) => {
      queryClient.invalidateQueries({ queryKey: ['borrower', id] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans', id] });
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      
      // Navigate to borrower detail page
      navigate(`/borrowers/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to add loan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Prepare loan data
    const loanData: AddLoanRequest = {
      ...formData,
      loan_type: loanType,
      borrower_name: borrower?.name || '',
    };
    
    // Add collateral data based on loan type
    if (loanType === 'bike' || loanType === 'car') {
      loanData.collateral = {
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        registration_number: registrationNumber,
        rc_book_number: rcBookNumber,
        year: yearOfManufacture ? parseInt(yearOfManufacture) : undefined,
      };
    }
    
    addLoanMutation.mutate(loanData);
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
              <div key={loan.id} className="p-4 bg-surface-gray-light dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg">
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
                      ₹{formatCurrency(loan.monthly_emi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Outstanding</p>
                    <p className="text-sm font-semibold text-warning mono-number">
                      ₹{formatCurrency(loan.outstanding_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-sm font-semibold text-success mono-number">
                      ₹{formatCurrency(loan.amount_paid)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-300 dark:border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Monthly EMI</p>
              <p className="text-lg font-bold text-primary mono-number">
                ₹{formatCurrency(loanSummary.total_monthly_emi)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Outstanding</p>
              <p className="text-lg font-bold text-warning mono-number">
                ₹{formatCurrency(loanSummary.total_outstanding)}
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
            
            {/* Loan Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select Loan Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLoanType('personal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    loanType === 'personal'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-zinc-800 bg-surface-gray-light text-slate-400 hover:border-zinc-700'
                  }`}
                >
                  <LoanTypeIcon type="personal" size="lg" className="mb-2" />
                  <div className="text-sm font-semibold">Personal</div>
                  <div className="text-xs mt-1">Unsecured</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setLoanType('bike')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    loanType === 'bike'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-zinc-800 bg-surface-gray-light text-slate-400 hover:border-zinc-700'
                  }`}
                >
                  <LoanTypeIcon type="bike" size="lg" className="mb-2" />
                  <div className="text-sm font-semibold">Bike</div>
                  <div className="text-xs mt-1">Secured</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setLoanType('car')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    loanType === 'car'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-zinc-800 bg-surface-gray-light text-slate-400 hover:border-zinc-700'
                  }`}
                >
                  <LoanTypeIcon type="car" size="lg" className="mb-2" />
                  <div className="text-sm font-semibold">Car</div>
                  <div className="text-xs mt-1">Secured</div>
                </button>
              </div>
              
              {/* Gold Loan Notice */}
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Want to add a Gold Loan?</p>
                    <p className="text-xs text-slate-400 mt-1">Gold loans must be created from the dedicated Gold Loan page.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vehicle Details (Bike/Car) */}
            {(loanType === 'bike' || loanType === 'car') && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vehicle Make *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., Honda, Maruti"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vehicle Model *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., Activa, Swift"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., TN01AB1234"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      RC Book Number *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., RC123456789"
                      value={rcBookNumber}
                      onChange={(e) => setRcBookNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Year of Manufacture
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g., 2022"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={yearOfManufacture}
                      onChange={(e) => setYearOfManufacture(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
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
                      value={`${(companySettings.settings as any).loan_type_settings?.[loanType]?.interest_rate || companySettings.settings.interest_rate || 12}% per annum`}
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
                      value={(companySettings.settings as any).loan_type_settings?.[loanType]?.interest_type || companySettings.settings.interest_type || 'flat'}
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
                  ₹{formatCurrency(emiPreview.monthly_emi)}
                </p>
              </div>

              {/* Loan Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Principal</span>
                  <span className="text-sm font-semibold text-slate-100 mono-number">
                    ₹{formatCurrency(emiPreview.principal ?? formData.loan_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Total Interest</span>
                  <span className="text-sm font-semibold text-warning mono-number">
                    ₹{formatCurrency(emiPreview.total_interest)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-zinc-800">
                  <span className="text-sm font-medium text-slate-300">Total Payable</span>
                  <span className="text-lg font-bold text-slate-100 mono-number">
                    ₹{formatCurrency(emiPreview.total_payable)}
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
                        ₹{formatCurrency((loanSummary.total_monthly_emi || 0) + (emiPreview.monthly_emi || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Outstanding</span>
                      <span className="text-warning font-semibold mono-number">
                        ₹{formatCurrency((loanSummary.total_outstanding || 0) + (emiPreview.total_payable || 0))}
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
