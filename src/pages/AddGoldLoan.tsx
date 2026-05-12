import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { borrowerApi, CreateBorrowerRequest } from '../api/borrowerApi';
import { useToast } from '../context/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/companyApi';
import { lockerApi } from '../api/lockerApi';

interface GoldItem {
  description: string;
  weight_grams: number;
  purity: '18K' | '22K' | '24K';
}

export default function AddGoldLoan() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();

  // Borrower details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [address, setAddress] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [existingBorrower, setExistingBorrower] = useState<any>(null);

  // Gold items
  const [goldItems, setGoldItems] = useState<GoldItem[]>([
    { description: '', weight_grams: 0, purity: '22K' }
  ]);

  // Gold loan details
  const [goldRatePerGram, setGoldRatePerGram] = useState(6000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState(() => {
    const s = new Date();
    s.setMonth(s.getMonth() + 12);
    return s.toISOString().split('T')[0];
  });
  const [storageLocation, setStorageLocation] = useState('');
  const [selectedLocker, setSelectedLocker] = useState('');
  const [customLoanAmount, setCustomLoanAmount] = useState<number>(0);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const [loading, setLoading] = useState(false);

  // Get company settings for LTV
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  // Get available lockers
  const { data: availableLockers = [] } = useQuery({
    queryKey: ['lockers', 'available'],
    queryFn: () => lockerApi.getAll('available'),
  });

  // Calculate totals
  const totalGoldWeight = goldItems.reduce((sum, item) => sum + (item.weight_grams || 0), 0);
  const goldValue = totalGoldWeight * goldRatePerGram;
  const ltvPercentage = (companySettings?.settings as any)?.gold_ltv_percentage || 75;
  const maxLoanAmount = goldValue * (ltvPercentage / 100);
  const loanAmount = useCustomAmount ? customLoanAmount : maxLoanAmount;
  
  // Get interest rate from settings
  const goldInterestRate = (companySettings?.settings as any)?.loan_type_settings?.gold?.interest_rate || 12;
  
  // Calculate interest for bullet repayment (interest-only monthly)
  const monthlyInterest = (loanAmount * goldInterestRate / 100) / 12;
  const totalInterest = monthlyInterest * tenureMonths;
  const totalPayable = loanAmount + totalInterest;

  const addGoldItem = () => {
    setGoldItems([...goldItems, { description: '', weight_grams: 0, purity: '22K' }]);
  };

  // Recompute maturity date when startDate or tenureMonths change
  useEffect(() => {
    try {
      const s = new Date(startDate);
      const m = new Date(s);
      m.setMonth(m.getMonth() + tenureMonths);
      setMaturityDate(m.toISOString().split('T')[0]);
    } catch (e) {
      // ignore
    }
  }, [startDate, tenureMonths]);

  const removeGoldItem = (index: number) => {
    if (goldItems.length > 1) {
      setGoldItems(goldItems.filter((_, i) => i !== index));
    }
  };

  const updateGoldItem = (index: number, field: keyof GoldItem, value: any) => {
    const updated = [...goldItems];
    updated[index] = { ...updated[index], [field]: value };
    setGoldItems(updated);
  };

  // Check if phone number exists and auto-fill
  const handlePhoneChange = async (newPhone: string) => {
    setPhone(newPhone);
    
    if (newPhone.match(/^\+91\d{10}$/)) {
      setCheckingPhone(true);
      try {
        const history = await borrowerApi.getHistoryByPhone(newPhone);
        if (history.found && history.borrowers.length > 0) {
          const latestBorrower = history.borrowers[0].borrower;
          setExistingBorrower(latestBorrower);
          setName(latestBorrower.name);
          setAddress(latestBorrower.address);
          success(`Found existing borrower: ${latestBorrower.name}`);
        } else {
          setExistingBorrower(null);
        }
      } catch (err) {
        console.error('Error checking phone:', err);
      } finally {
        setCheckingPhone(false);
      }
    } else {
      setExistingBorrower(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      error('Please enter borrower name');
      return;
    }

    if (!phone.match(/^\+91\d{10}$/)) {
      error('Please enter valid phone number (+91XXXXXXXXXX)');
      return;
    }

    if (!address.trim()) {
      error('Please enter address');
      return;
    }

    if (goldItems.some(item => !item.description.trim() || item.weight_grams <= 0)) {
      error('Please fill all gold item details');
      return;
    }

    if (totalGoldWeight <= 0) {
      error('Total gold weight must be greater than 0');
      return;
    }

    if (!storageLocation.trim()) {
      error('Please enter storage location');
      return;
    }

    if (!selectedLocker) {
      error('Please select a locker');
      return;
    }

    if (useCustomAmount && customLoanAmount > maxLoanAmount) {
      error('Custom loan amount cannot exceed maximum loan amount');
      return;
    }

    if (useCustomAmount && customLoanAmount < 1000) {
      error('Loan amount must be at least ₹1,000');
      return;
    }

    setLoading(true);

    try {
      const borrowerData: CreateBorrowerRequest = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        loan_type: 'gold' as const,
        loan_amount: loanAmount,
        tenure_months: tenureMonths,
        start_date: startDate,
        maturity_date: maturityDate,
        repayment_type: 'bullet' as const,
        collateral: {
          gold_items: goldItems,
          total_gold_weight: totalGoldWeight,
          gold_rate_per_gram: goldRatePerGram,
          ltv_percentage: ltvPercentage,
          storage_location: storageLocation.trim(),
          locker_number: selectedLocker,
          gold_value: goldValue
        }
      };

      const createdBorrower = await borrowerApi.create(borrowerData);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      
      success('Gold loan created successfully!');
      navigate(`/gold-loans/${createdBorrower.id}`);
    } catch (err: any) {
      console.error('Error creating gold loan:', err);
      error(err.response?.data?.detail || 'Failed to create gold loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/borrowers')}
          className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Borrowers
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Add Gold Loan</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Pure Bullet Repayment - Interest-only monthly payments</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Borrower Details */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Borrower Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                placeholder="Enter borrower name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                  placeholder="+91XXXXXXXXXX"
                  required
                />
                {checkingPhone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {existingBorrower && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Existing borrower found - details auto-filled
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                rows={3}
                placeholder="Enter complete address"
                required
              />
            </div>
          </div>
        </div>

        {/* Gold Items */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Gold Items</h2>
            <button
              type="button"
              onClick={addGoldItem}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {goldItems.map((item, index) => (
              <div key={index} className="p-4 border border-slate-200 dark:border-zinc-700 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Item {index + 1}</h3>
                  {goldItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoldItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateGoldItem(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                      placeholder="e.g., Gold chain"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Weight (grams) *
                    </label>
                    <input
                      type="number"
                      value={item.weight_grams || ''}
                      onChange={(e) => updateGoldItem(index, 'weight_grams', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Purity *
                    </label>
                    <select
                      value={item.purity}
                      onChange={(e) => updateGoldItem(index, 'purity', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                      required
                    >
                      <option value="18K">18K</option>
                      <option value="22K">22K</option>
                      <option value="24K">24K</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation & Loan Calculation */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">💰 Valuation & Loan Calculation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gold Rate (₹/gram) *
              </label>
              <input
                type="number"
                value={goldRatePerGram}
                onChange={(e) => setGoldRatePerGram(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                min="0"
                step="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tenure (months) *
              </label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                min="1"
                max="36"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Maturity Date
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Date when principal + accrued interest is due and gold will be released.
              </p>
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total Gold Weight:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalGoldWeight.toFixed(2)} grams</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Gold Value:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{goldValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">LTV ({ltvPercentage}%):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{ltvPercentage}%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configured in Company Settings</p>
            <div className="border-t border-slate-200 dark:border-zinc-700 pt-3 flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Maximum Loan Amount:</span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{maxLoanAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Custom Loan Amount Option */}
          <div className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomAmount}
                onChange={(e) => {
                  setUseCustomAmount(e.target.checked);
                  if (e.target.checked && customLoanAmount === 0) {
                    setCustomLoanAmount(maxLoanAmount);
                  }
                }}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Use custom loan amount (less than maximum)
              </span>
            </label>

            {useCustomAmount && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Custom Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  value={customLoanAmount || ''}
                  onChange={(e) => setCustomLoanAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                  placeholder="Enter custom amount"
                  min="1000"
                  max={maxLoanAmount}
                  step="1000"
                  required={useCustomAmount}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Amount must be between ₹1,000 and ₹{maxLoanAmount.toLocaleString('en-IN')} (maximum)
                </p>
                {customLoanAmount > maxLoanAmount && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    ⚠️ Amount exceeds maximum loan amount
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Final Loan Amount Display */}
          {useCustomAmount && customLoanAmount > 0 && customLoanAmount <= maxLoanAmount && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Loan Amount:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">₹{customLoanAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 dark:text-green-300">Interest Rate:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">{goldInterestRate}% per annum</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 dark:text-green-300">Monthly Interest Payment:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">₹{monthlyInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 dark:text-green-300">Total Interest ({tenureMonths} months):</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">₹{totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-green-300 dark:border-green-700 pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">Total Payable:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                You're borrowing ₹{(maxLoanAmount - customLoanAmount).toLocaleString('en-IN')} less than the maximum
              </p>
            </div>
          )}

          {/* Repayment Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Pure Bullet Repayment</h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span className="font-semibold">{goldInterestRate}% per annum</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Interest Payment:</span>
                <span className="font-semibold">₹{monthlyInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Principal Due at Maturity (Month {tenureMonths}):</span>
                <span className="font-semibold">₹{loanAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-blue-300 dark:border-blue-700 pt-2 flex justify-between">
                <span className="font-semibold">Total Payable:</span>
                <span className="font-bold">₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 mt-3">
              <li>✓ Interest-only monthly payments</li>
              <li>✓ Principal amount due at maturity (month {tenureMonths})</li>
              <li>✓ Gold released only after full payment</li>
            </ul>
          </div>
        </div>

        {/* Storage Details */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">🔒 Storage Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Storage Location *
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                placeholder="e.g., Main Branch Vault"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Storage Locker *
              </label>
              <select
                value={selectedLocker}
                onChange={(e) => setSelectedLocker(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-slate-100"
                required
              >
                <option value="">Select a locker</option>
                {availableLockers.map((locker: any) => (
                  <option key={locker.id} value={locker.locker_number}>
                    {locker.locker_number} - {locker.location}
                  </option>
                ))}
              </select>
              {availableLockers.length === 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  No available lockers. Please add lockers in Gold Lockers page.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/borrowers')}
            className="px-6 py-3 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loanAmount <= 0}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Gold Loan'}
          </button>
        </div>
      </form>
    </div>
  );
}
