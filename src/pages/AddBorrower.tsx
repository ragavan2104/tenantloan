import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { borrowerApi, CreateBorrowerRequest } from '../api/borrowerApi';
import { loanApi } from '../api/loanApi';
import { companyApi } from '../api/companyApi';
import { lockerApi } from '../api/lockerApi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useToast } from '../context/ToastContext';
import LoanTypeIcon from '../components/LoanTypeIcon';

const AddBorrower = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();

  const [formData, setFormData] = useState<CreateBorrowerRequest>({
    name: '',
    phone: '',
    address: '',
    loan_amount: '' as any,
    tenure_months: 12,
    start_date: new Date().toISOString().split('T')[0],
  });

  const [countryCode, setCountryCode] = useState('+91'); // Default to India
  const [loanType, setLoanType] = useState<'personal' | 'bike' | 'car' | 'gold'>('personal');
  const [emiPreview, setEmiPreview] = useState<any>(null);
  const [error, setError] = useState('');
  const [phoneHistory, setPhoneHistory] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Gold loan specific states
  const [goldWeight, setGoldWeight] = useState<number>(0);
  const [goldPurity, setGoldPurity] = useState<'18K' | '22K' | '24K'>('22K');
  const [calculatedGoldValue, setCalculatedGoldValue] = useState<number>(0);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(0);
  const [selectedLocker, setSelectedLocker] = useState<string>('');

  // Common country codes
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+65', country: 'Singapore' },
    { code: '+60', country: 'Malaysia' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
  ];

  // Get company settings (applies to all branches)
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  // Get available lockers for gold loans
  const { data: availableLockers = [] } = useQuery({
    queryKey: ['lockers', 'available'],
    queryFn: () => lockerApi.getAll('available'),
    enabled: loanType === 'gold',
  });

  // Calculate EMI preview
  useEffect(() => {
    const loanAmount = typeof formData.loan_amount === 'string' ? parseFloat(formData.loan_amount) : formData.loan_amount;
    if (loanAmount > 0 && formData.tenure_months > 0 && companySettings?.settings) {
      // Get loan type specific settings
      const loanTypeSettings = (companySettings.settings as any).loan_type_settings?.[loanType];
      const interestRate = loanTypeSettings?.interest_rate || companySettings.settings.interest_rate || 12;
      const interestType = loanTypeSettings?.interest_type || companySettings.settings.interest_type || 'flat';
      
      loanApi.calculate({
        principal: loanAmount,
        interest_rate: interestRate,
        interest_type: interestType,
        tenure_months: formData.tenure_months,
      }).then(setEmiPreview).catch(console.error);
    }
  }, [formData.loan_amount, formData.tenure_months, companySettings, loanType]);

  // Calculate gold loan amount based on weight and purity
  useEffect(() => {
    if (loanType === 'gold' && goldWeight > 0 && companySettings?.settings) {
      const goldRates = (companySettings.settings as any).gold_rates || { '18K': 5000, '22K': 6000, '24K': 7000 };
      const ratePerGram = goldRates[goldPurity] || 6000;
      
      // Calculate gold value - ensure proper number multiplication
      const goldValue = Number(goldWeight) * Number(ratePerGram);
      setCalculatedGoldValue(Math.round(goldValue));
      
      // Set max loan as gold value (no LTV or cap)
      const maxLoan = Math.round(goldValue);
      setMaxLoanAmount(maxLoan);
      
      // Auto-set loan amount (don't exceed max)
      const currentLoanAmount = typeof formData.loan_amount === 'string' ? parseFloat(formData.loan_amount) : formData.loan_amount;
      if (currentLoanAmount > maxLoan) {
        setFormData({ ...formData, loan_amount: maxLoan });
      }
    }
  }, [goldWeight, goldPurity, loanType, companySettings]);

  const createMutation = useMutation({
    mutationFn: borrowerApi.create,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      toast.success('Borrower and loan created successfully!');
      
      // Fetch the loans for this borrower to get the loan ID
      try {
        const loanSummary = await loanApi.getBorrowerLoans(data.id);
        if (loanSummary.loans && loanSummary.loans.length > 0) {
          // Navigate to the first loan's details page
          const firstLoan = loanSummary.loans[0];
          navigate(`/borrowers/${data.id}/loans/${firstLoan.id}`);
        } else {
          // Fallback to borrower detail page if no loans found
          navigate(`/borrowers/${data.id}`);
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        // Fallback to borrower detail page on error
        navigate(`/borrowers/${data.id}`);
      }
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.detail || 'Failed to add borrower';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if phone has active loan
    if (phoneHistory?.borrowers.some((h: any) => h.borrower.loan_status === 'active')) {
      setError('Cannot create new borrower. This phone number has an active loan. Use "Add Loan" instead.');
      return;
    }
    
    // Combine country code with phone number
    const fullPhone = `${countryCode}${formData.phone}`;
    createMutation.mutate({ ...formData, phone: fullPhone, loan_type: loanType });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' 
      ? (e.target.value === '' ? '' : parseFloat(e.target.value))
      : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  // Check phone number history when phone is entered (10 digits)
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, phone });
    
    // Check if phone number is complete (10 digits)
    const digitsOnly = phone.replace(/\D/g, '');
    console.log('Phone input:', phone, 'Digits only:', digitsOnly);
    
    if (digitsOnly.length === 10) {
      setCheckingPhone(true);
      console.log('Checking history for phone:', phone);
      try {
        const history = await borrowerApi.getHistoryByPhone(phone);
        console.log('History response:', history);
        if (history.found && history.borrowers.length > 0) {
          // Check if any loan is active
          const hasActiveLoan = history.borrowers.some(
            (h: any) => h.borrower.loan_status === 'active'
          );
          
          if (hasActiveLoan) {
            setError('This phone number already has an active loan. Please use "Add Loan" from the borrower\'s card instead.');
            setPhoneHistory(history);
            setShowHistory(true);
          } else {
            setPhoneHistory(history);
            setShowHistory(true);
            setError('');
          }
          console.log('Found history:', history.total_loans, 'loans');
        } else {
          setPhoneHistory(null);
          setShowHistory(false);
          setError('');
          console.log('No history found for this phone');
        }
      } catch (err) {
        console.error('Error checking phone history:', err);
        // Show error to user
        if (err instanceof Error) {
          console.error('Error details:', err.message);
        }
      } finally {
        setCheckingPhone(false);
      }
    } else {
      setPhoneHistory(null);
      setShowHistory(false);
      setError('');
    }
  };

  return (
    <div className="page-shell max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-4">
        <Link to="/borrowers" className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800">
          <ArrowLeftIcon className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="page-title">Add Borrower</h1>
          <p className="page-subtitle">Create a new loan account</p>
        </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-600 rounded-lg">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-card p-6 space-y-6">
          {/* Personal Details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Rajesh Kumar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="input-field w-32"
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.code} - {cc.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="input-field flex-1"
                    placeholder="9876543210"
                    required
                  />
                </div>
                {checkingPhone && (
                  <p className="text-xs text-slate-400 mt-1">Checking history...</p>
                )}
                {phoneHistory && phoneHistory.found && (
                  <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded">
                    <p className="text-xs text-warning">
                      ⚠️ Found {phoneHistory.total_loans} existing loan(s) for this number
                      {phoneHistory.borrowers.some((h: any) => h.borrower.loan_status === 'active') && (
                        <span className="block mt-1 text-danger font-semibold">
                          Active loan exists - Cannot create new borrower
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      {showHistory ? 'Hide' : 'View'} History
                    </button>
                  </div>
                )}
              </div>

              <div>
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

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field min-h-[80px]"
                  placeholder="Full address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="pt-6 border-t border-zinc-800">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Loan Details</h2>
            
            {/* Loan Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select Loan Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                
                <button
                  type="button"
                  onClick={() => setLoanType('gold')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    loanType === 'gold'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-zinc-800 bg-surface-gray-light text-slate-400 hover:border-zinc-700'
                  }`}
                >
                  <LoanTypeIcon type="gold" size="lg" className="mb-2" />
                  <div className="text-sm font-semibold">Gold</div>
                  <div className="text-xs mt-1">Secured</div>
                </button>
              </div>
            </div>
            
            {/* Vehicle Details (Bike/Car) */}
            {(loanType === 'bike' || loanType === 'car') && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
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
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gold Loan Details */}
            {loanType === 'gold' && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-400 mb-4">Gold Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gold Item Description *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., Gold chain, Gold ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Weight (grams) *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g., 50"
                      min="0.1"
                      step="0.1"
                      value={goldWeight || ''}
                      onChange={(e) => setGoldWeight(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Purity *
                    </label>
                    <select 
                      className="input-field" 
                      value={goldPurity}
                      onChange={(e) => setGoldPurity(e.target.value as '18K' | '22K' | '24K')}
                      required
                    >
                      <option value="18K">18K (75% pure)</option>
                      <option value="22K">22K (91.6% pure)</option>
                      <option value="24K">24K (99.9% pure)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Gold Rate per gram (₹)
                    </label>
                    <input
                      type="text"
                      value={`₹${((companySettings?.settings as any)?.gold_rates?.[goldPurity] || 6000).toLocaleString()}`}
                      className="input-field"
                      disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">Set in Company Settings</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Repayment Type *
                    </label>
                    <select className="input-field" required>
                      <option value="emi">EMI (Monthly)</option>
                      <option value="bullet">Bullet (One-time)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Storage Locker *
                    </label>
                    <select 
                      className="input-field"
                      value={selectedLocker}
                      onChange={(e) => setSelectedLocker(e.target.value)}
                      required
                    >
                      <option value="">Select a locker</option>
                      {availableLockers.map((locker) => (
                        <option key={locker.id} value={locker.id}>
                          {locker.locker_number} - {locker.location}
                        </option>
                      ))}
                    </select>
                    {availableLockers.length === 0 && (
                      <p className="text-xs text-danger mt-1">
                        No available lockers. Please add lockers in Gold Lockers page.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Gold Value Calculation */}
                {goldWeight > 0 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <h4 className="text-xs font-semibold text-yellow-400 mb-2">Calculation:</h4>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>• Gold Value: {goldWeight}g × ₹{((companySettings?.settings as any)?.gold_rates?.[goldPurity] || 6000).toLocaleString()} = ₹{calculatedGoldValue.toLocaleString()}</p>
                      <p className="font-semibold text-yellow-400 mt-2 flex items-center gap-2">
                        <LoanTypeIcon type="gold" size="sm" className="text-yellow-400" />
                        <span>Maximum Loan Amount: ₹{maxLoanAmount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                )}
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
                  placeholder="100000"
                  min="1000"
                  step="1000"
                  max={loanType === 'gold' && maxLoanAmount > 0 ? maxLoanAmount : undefined}
                  required
                />
                {loanType === 'gold' && maxLoanAmount > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Maximum: ₹{maxLoanAmount.toLocaleString()} (based on gold value)
                  </p>
                )}
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

                  <div className="sm:col-span-2">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold">Due Date:</span> All EMIs will be due on the{' '}
                        <span className="font-semibold text-primary">
                          {companySettings.settings.due_date_of_month}
                          {companySettings.settings.due_date_of_month === 1 ? 'st' : 
                           companySettings.settings.due_date_of_month === 2 ? 'nd' :
                           companySettings.settings.due_date_of_month === 3 ? 'rd' : 'th'}
                        </span>{' '}
                        of each month. First EMI will be due on{' '}
                        {formData.start_date && (() => {
                          const startDate = new Date(formData.start_date);
                          const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, companySettings.settings.due_date_of_month);
                          return nextMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        })()}.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-zinc-800">
            <Link to="/borrowers" className="btn-secondary text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || (phoneHistory?.borrowers.some((h: any) => h.borrower.loan_status === 'active'))}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Borrower'}
            </button>
          </div>
        </form>

        {/* EMI Preview */}
        <div className="glass-card p-6 h-fit sticky top-24">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">EMI Preview</h3>
          
          {emiPreview ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Monthly EMI</p>
                <p className="text-2xl font-bold text-primary mono-number">
                  ₹{emiPreview.monthly_emi.toLocaleString()}
                </p>
              </div>

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

              {/* Monthly Schedule */}
              {emiPreview.schedule && emiPreview.schedule.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Monthly Schedule</h4>
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {emiPreview.schedule.map((month: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-400">
                            Month {month.month}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(month.due_date).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Principal</span>
                            <span className="text-slate-300 mono-number">
                              ₹{Math.round(month.principal_component).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Interest</span>
                            <span className="text-warning mono-number">
                              ₹{Math.round(month.interest_component).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-zinc-800">
                            <span className="text-slate-400 font-medium">Due Amount</span>
                            <span className="text-slate-100 font-semibold mono-number">
                              ₹{Math.round(month.emi_amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Enter loan amount and tenure to see EMI preview
            </p>
          )}
        </div>
      </div>

      {/* Borrower History Modal/Section */}
      {showHistory && phoneHistory && phoneHistory.borrowers && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              Loan History for {phoneHistory.phone}
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              &times;
            </button>
          </div>

          <div className="space-y-6">
            {phoneHistory.borrowers.map((history: any, index: number) => (
              <div key={index} className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
                {/* Borrower Info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {history.borrower.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Branch: {history.borrower.branch_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Started: {new Date(history.borrower.start_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    history.borrower.loan_status === 'active' 
                      ? 'bg-success/10 text-success'
                      : history.borrower.loan_status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {history.borrower.loan_status}
                  </span>
                </div>

                {/* Loan Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Loan Amount</p>
                    <p className="text-sm font-semibold text-slate-200 mono-number">
                      ₹{history.borrower.loan_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Payable</p>
                    <p className="text-sm font-semibold text-slate-200 mono-number">
                      ₹{history.borrower.total_payable.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount Paid</p>
                    <p className="text-sm font-semibold text-success mono-number">
                      ₹{history.total_paid.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Outstanding</p>
                    <p className="text-sm font-semibold text-warning mono-number">
                      ₹{history.borrower.outstanding_balance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {history.payments && history.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">
                      Payment History ({history.payment_count} payments)
                    </h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar">
                      {history.payments.slice(0, 5).map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded">
                          <div>
                            <p className="text-xs text-slate-400">
                              {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">{payment.payment_mode}</p>
                          </div>
                          <p className="text-sm font-semibold text-success mono-number">
                            ₹{payment.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                      {history.payments.length > 5 && (
                        <p className="text-xs text-slate-500 text-center pt-2">
                          + {history.payments.length - 5} more payments
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* EMI Schedule Summary */}
                {history.schedules && history.schedules.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">
                      EMI Schedule ({history.schedules.length} installments)
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <p className="text-xs text-slate-500">Paid</p>
                        <p className="text-sm font-semibold text-success">
                          {history.schedules.filter((s: any) => s.status === 'paid').length}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <p className="text-xs text-slate-500">Pending</p>
                        <p className="text-sm font-semibold text-warning">
                          {history.schedules.filter((s: any) => s.status === 'pending').length}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <p className="text-xs text-slate-500">Overdue</p>
                        <p className="text-sm font-semibold text-danger">
                          {history.schedules.filter((s: any) => s.status === 'overdue').length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBorrower;
