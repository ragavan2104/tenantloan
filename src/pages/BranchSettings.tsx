import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { branchApi } from '../api/branchApi';
import { Cog6ToothIcon, CurrencyRupeeIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const BranchSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch', user?.branchId],
    queryFn: () => branchApi.getById(user?.branchId || ''),
    enabled: !!user?.branchId,
  });

  const [settings, setSettings] = useState({
    interest_rate: 12,
    interest_type: 'flat',
    due_date_of_month: 1,
    late_penalty_rate: 2,
    penalty_enabled: true,
    penalty_calculation_base: 'due_amount', // 'due_amount' or 'total_amount'
    grace_period_days: 0,
  });

  useEffect(() => {
    if (branch?.settings) {
      setSettings({
        interest_rate: branch.settings.interest_rate || 12,
        interest_type: branch.settings.interest_type || 'flat',
        due_date_of_month: branch.settings.due_date_of_month || 1,
        late_penalty_rate: branch.settings.late_penalty_rate || 2,
        penalty_enabled: branch.settings.penalty_enabled ?? true,
        penalty_calculation_base: branch.settings.penalty_calculation_base || 'due_amount',
        grace_period_days: branch.settings.grace_period_days || 0,
      });
    }
  }, [branch]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => branchApi.updateSettings(user?.branchId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch', user?.branchId] });
      alert('Settings updated successfully!');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Branch Settings</h1>
          <p className="text-slate-400 mt-1">Configure loan and penalty settings for {branch?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interest Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-100">Interest Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interest Rate (% per annum) *
              </label>
              <input
                type="number"
                value={settings.interest_rate}
                onChange={(e) => setSettings({ ...settings, interest_rate: parseFloat(e.target.value) })}
                className="input-field"
                step="0.1"
                min="0"
                max="100"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Annual interest rate percentage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interest Calculation Method *
              </label>
              <select
                value={settings.interest_type}
                onChange={(e) => setSettings({ ...settings, interest_type: e.target.value })}
                className="input-field"
                required
              >
                <option value="flat">Flat Rate</option>
                <option value="reducing_balance">Reducing Balance</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {settings.interest_type === 'flat' ? 'Interest on original amount' : 'Interest on remaining balance'}
              </p>
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
              <p className="text-sm text-slate-400">Late payment penalties are currently disabled</p>
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
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary px-8"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default BranchSettings;
