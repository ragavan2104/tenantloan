import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { companyApi } from '../api/companyApi';
import { Cog6ToothIcon, CurrencyRupeeIcon, CalendarIcon, ExclamationTriangleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import LoanTypeIcon from '../components/LoanTypeIcon';

const CompanySettings = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId,
  });

  const [settings, setSettings] = useState({
    interest_rate: 12,
    interest_type: 'flat',
    due_date_of_month: 1,
    late_penalty_rate: 2,
    penalty_enabled: true,
    penalty_calculation_base: 'due_amount',
    grace_period_days: 0,
    loan_type_settings: {
      personal: { interest_rate: 18, interest_type: 'flat' },
      bike: { interest_rate: 15, interest_type: 'flat' },
      car: { interest_rate: 12, interest_type: 'flat' },
      gold: { interest_rate: 12, interest_type: 'flat' },
    },
    gold_rates: {
      '18K': 5000,
      '22K': 6000,
      '24K': 7000,
    },
    gold_ltv_percentage: 75,
  });

  useEffect(() => {
    if (company?.settings) {
      setSettings({
        interest_rate: company.settings.interest_rate || 12,
        interest_type: company.settings.interest_type || 'flat',
        due_date_of_month: company.settings.due_date_of_month || 1,
        late_penalty_rate: company.settings.late_penalty_rate || 2,
        penalty_enabled: company.settings.penalty_enabled ?? true,
        penalty_calculation_base: company.settings.penalty_calculation_base || 'due_amount',
        grace_period_days: company.settings.grace_period_days || 0,
        loan_type_settings: company.settings.loan_type_settings || {
          personal: { interest_rate: 18, interest_type: 'flat' },
          bike: { interest_rate: 15, interest_type: 'flat' },
          car: { interest_rate: 12, interest_type: 'flat' },
          gold: { interest_rate: 12, interest_type: 'flat' },
        },
        gold_rates: (company.settings as any).gold_rates || {
          '18K': 5000,
          '22K': 6000,
          '24K': 7000,
        },
        gold_ltv_percentage: (company.settings as any).gold_ltv_percentage || 75,
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyApi.updateSettings(user?.companyId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', user?.companyId] });
      alert('Company settings updated successfully! These settings will apply to all branches.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Cog6ToothIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Company Settings</h1>
          <p className="text-slate-400 mt-1">Configure default settings for all branches under {company?.name}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 border-l-4 border-primary">
        <div className="flex items-start gap-3">
          <BuildingOfficeIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Company-Wide Settings</h3>
            <p className="text-sm text-slate-400">
              These settings will be applied as defaults to all branches in your company. 
              Individual branches cannot override these settings.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Type Specific Interest Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-100">Loan Type Interest Settings</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">Configure different interest rates for each loan type</p>

          <div className="space-y-6">
            {/* Personal Loan */}
            <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <LoanTypeIcon type="personal" size="lg" className="text-primary" />
                <h3 className="text-lg font-semibold text-slate-100">Personal Loan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Rate (% per annum) *
                  </label>
                  <input
                    type="number"
                    value={settings.loan_type_settings.personal.interest_rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        personal: { ...settings.loan_type_settings.personal, interest_rate: parseFloat(e.target.value) }
                      }
                    })}
                    className="input-field"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Type *
                  </label>
                  <select
                    value={settings.loan_type_settings.personal.interest_type}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        personal: { ...settings.loan_type_settings.personal, interest_type: e.target.value }
                      }
                    })}
                    className="input-field"
                    required
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="reducing_balance">Reducing Balance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bike Loan */}
            <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <LoanTypeIcon type="bike" size="lg" className="text-primary" />
                <h3 className="text-lg font-semibold text-slate-100">Bike Loan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Rate (% per annum) *
                  </label>
                  <input
                    type="number"
                    value={settings.loan_type_settings.bike.interest_rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        bike: { ...settings.loan_type_settings.bike, interest_rate: parseFloat(e.target.value) }
                      }
                    })}
                    className="input-field"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Type *
                  </label>
                  <select
                    value={settings.loan_type_settings.bike.interest_type}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        bike: { ...settings.loan_type_settings.bike, interest_type: e.target.value }
                      }
                    })}
                    className="input-field"
                    required
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="reducing_balance">Reducing Balance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Car Loan */}
            <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <LoanTypeIcon type="car" size="lg" className="text-primary" />
                <h3 className="text-lg font-semibold text-slate-100">Car Loan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Rate (% per annum) *
                  </label>
                  <input
                    type="number"
                    value={settings.loan_type_settings.car.interest_rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        car: { ...settings.loan_type_settings.car, interest_rate: parseFloat(e.target.value) }
                      }
                    })}
                    className="input-field"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Type *
                  </label>
                  <select
                    value={settings.loan_type_settings.car.interest_type}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        car: { ...settings.loan_type_settings.car, interest_type: e.target.value }
                      }
                    })}
                    className="input-field"
                    required
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="reducing_balance">Reducing Balance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gold Loan Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <LoanTypeIcon type="gold" size="lg" className="text-yellow-500" />
            <h2 className="text-xl font-semibold text-slate-100">Gold Loan Settings</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">Configure gold loan interest, rates and LTV</p>

          <div className="space-y-6">
            {/* Gold Loan Interest Rate */}
            <div className="p-4 bg-surface-gray-light rounded-lg border border-zinc-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Interest Rate for Gold Loans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Rate (% per annum) *
                  </label>
                  <input
                    type="number"
                    value={settings.loan_type_settings.gold.interest_rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        gold: { ...settings.loan_type_settings.gold, interest_rate: parseFloat(e.target.value) }
                      }
                    })}
                    className="input-field"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Interest Type *
                  </label>
                  <select
                    value={settings.loan_type_settings.gold.interest_type}
                    onChange={(e) => setSettings({
                      ...settings,
                      loan_type_settings: {
                        ...settings.loan_type_settings,
                        gold: { ...settings.loan_type_settings.gold, interest_type: e.target.value }
                      }
                    })}
                    className="input-field"
                    required
                  >
                    <option value="flat">Flat Rate (Bullet Repayment)</option>
                    <option value="reducing_balance">Reducing Balance</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Gold loans use bullet repayment - interest-only monthly payments with principal due at maturity
              </p>
            </div>

            {/* LTV Setting */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan-to-Value (LTV) Percentage *
              </label>
              <input
                type="number"
                value={settings.gold_ltv_percentage}
                onChange={(e) => setSettings({
                  ...settings,
                  gold_ltv_percentage: parseFloat(e.target.value)
                })}
                className="input-field max-w-xs"
                min="1"
                max="100"
                step="1"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum loan amount as percentage of gold value (RBI guideline: max 75%)
              </p>
            </div>

            {/* Gold Rates per Purity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Gold Rate per Gram (₹)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    18K (75% pure) *
                  </label>
                  <input
                    type="number"
                    value={settings.gold_rates['18K']}
                    onChange={(e) => setSettings({
                      ...settings,
                      gold_rates: { ...settings.gold_rates, '18K': parseFloat(e.target.value) }
                    })}
                    className="input-field"
                    min="1000"
                    step="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    22K (91.6% pure) *
                  </label>
                  <input
                    type="number"
                    value={settings.gold_rates['22K']}
                    onChange={(e) => setSettings({
                      ...settings,
                      gold_rates: { ...settings.gold_rates, '22K': parseFloat(e.target.value) }
                    })}
                    className="input-field"
                    min="1000"
                    step="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    24K (99.9% pure) *
                  </label>
                  <input
                    type="number"
                    value={settings.gold_rates['24K']}
                    onChange={(e) => setSettings({
                      ...settings,
                      gold_rates: { ...settings.gold_rates, '24K': parseFloat(e.target.value) }
                    })}
                    className="input-field"
                    min="1000"
                    step="100"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">Example Calculation:</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p>• Gold Weight: 10 grams</p>
                <p>• Purity: 24K</p>
                <p>• Rate per gram: ₹{settings.gold_rates['24K'].toLocaleString()}</p>
                <p>• Gold Value: 10g × ₹{settings.gold_rates['24K'].toLocaleString()} = ₹{(10 * settings.gold_rates['24K']).toLocaleString()}</p>
                <p>• LTV: {settings.gold_ltv_percentage}%</p>
                <p className="font-semibold text-yellow-400 mt-2 flex items-center gap-2">
                  <LoanTypeIcon type="gold" size="sm" className="text-yellow-400" />
                  <span>Maximum Loan Amount: ₹{Math.round((10 * settings.gold_rates['24K'] * settings.gold_ltv_percentage / 100)).toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Due Date Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-100">Due Date Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Due Date of Month *
              </label>
              <select
                value={settings.due_date_of_month}
                onChange={(e) => setSettings({ ...settings, due_date_of_month: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Day of the month when EMI is due (1-28). For months with fewer days, the last day will be used.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Grace Period (Days)
              </label>
              <input
                type="number"
                value={settings.grace_period_days}
                onChange={(e) => setSettings({ ...settings, grace_period_days: parseInt(e.target.value) })}
                className="input-field"
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Days after due date before penalty applies</p>
            </div>
          </div>

          {/* Example */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Example:</h3>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• Loan disbursed on: January 15, 2024</p>
              <p>• Due date setting: {settings.due_date_of_month}</p>
              <p>• First EMI due: February {settings.due_date_of_month}, 2024</p>
              <p>• Second EMI due: March {settings.due_date_of_month}, 2024</p>
              <p className="text-blue-400 mt-2">
                All EMIs will be due on the {settings.due_date_of_month}{settings.due_date_of_month === 1 ? 'st' : settings.due_date_of_month === 2 ? 'nd' : settings.due_date_of_month === 3 ? 'rd' : 'th'} of each month
              </p>
            </div>
          </div>
        </div>

        {/* Penalty Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
              <h2 className="text-xl font-semibold text-slate-100">Late Payment Penalty</h2>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-slate-300">Enable Penalty</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.penalty_enabled}
                  onChange={(e) => setSettings({ ...settings, penalty_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>

          {settings.penalty_enabled && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Penalty Rate (% per day) *
                  </label>
                  <input
                    type="number"
                    value={settings.late_penalty_rate}
                    onChange={(e) => setSettings({ ...settings, late_penalty_rate: parseFloat(e.target.value) })}
                    className="input-field"
                    step="0.1"
                    min="0"
                    max="10"
                    required={settings.penalty_enabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">Daily penalty rate after grace period</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Calculate Penalty On *
                  </label>
                  <select
                    value={settings.penalty_calculation_base}
                    onChange={(e) => setSettings({ ...settings, penalty_calculation_base: e.target.value })}
                    className="input-field"
                    required={settings.penalty_enabled}
                  >
                    <option value="due_amount">Due Amount Only</option>
                    <option value="total_amount">Total Outstanding Amount</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {settings.penalty_calculation_base === 'due_amount' 
                      ? 'Penalty on current EMI only' 
                      : 'Penalty on entire remaining balance'}
                  </p>
                </div>
              </div>

              {/* Penalty Example */}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-warning mb-2">Example Calculation:</h3>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Due Amount: ₹10,000</p>
                  <p>• Days Overdue: 5 days (after grace period)</p>
                  <p>• Penalty Rate: {settings.late_penalty_rate}% per day</p>
                  <p className="font-semibold text-warning mt-2">
                    Penalty = {settings.penalty_calculation_base === 'due_amount' ? '₹10,000' : 'Total Outstanding'} × {settings.late_penalty_rate}% × 5 days
                    = ₹{(10000 * settings.late_penalty_rate / 100 * 5).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!settings.penalty_enabled && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-400">Late payment penalties are currently disabled for all branches</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary px-8 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Company Settings'}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary px-8"
          >
            Reset
          </button>
        </div>

        {/* Warning */}
        <div className="glass-card p-4 border-l-4 border-warning">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Important Note</h3>
              <p className="text-sm text-slate-400">
                These settings will be applied to all existing and new branches. 
                Branch admins cannot modify these settings. Only the company owner can change them.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
