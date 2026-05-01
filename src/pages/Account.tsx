import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { companyApi } from '../api/companyApi';
import { userApi } from '../api/userApi';
import axiosInstance from '../api/axiosInstance';
import {
  CreditCardIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

interface PricingBreakdown {
  tier: number;
  tier_name: string;
  branches: number;
  price_per_branch: number;
  tier_total: number;
  description: string;
}

interface UpgradePricing {
  current_branches: number;
  new_branches: number;
  additional_branches: number;
  current_price: number;
  new_price: number;
  price_increase: number;
  current_breakdown: PricingBreakdown[];
  new_breakdown: PricingBreakdown[];
  is_prorated?: boolean;
  explanation?: string;
  remaining_days?: number;
  remaining_months?: number;
  price_difference?: number;
  breakdown?: PricingBreakdown[];
  new_annual_price?: number;
  prorated_amount?: number;
}

const Account = () => {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({
    requested_limit: '',
    reason: '',
  });
  const [estimatedPricing, setEstimatedPricing] = useState<UpgradePricing | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch full user profile
  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getMe(),
    enabled: !!authUser,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', authUser?.companyId],
    queryFn: () => companyApi.getById(authUser!.companyId),
    enabled: !!authUser?.companyId,
  });

  const { data: upgradeRequests } = useQuery({
    queryKey: ['upgrade-requests', authUser?.companyId],
    queryFn: () => companyApi.getUpgradeRequests(authUser!.companyId),
    enabled: !!authUser?.companyId,
  });

  const requestUpgradeMutation = useMutation({
    mutationFn: (data: any) => companyApi.requestBranchUpgrade(authUser!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-requests'] });
      setShowUpgradeModal(false);
      setUpgradeForm({ requested_limit: '', reason: '' });
      setEstimatedPricing(null);
      alert('Upgrade request submitted successfully!');
    },
  });

  // Calculate pricing when requested limit changes
  useEffect(() => {
    const fetchPricing = async () => {
      const requestedLimit = parseInt(upgradeForm.requested_limit);
      const currentLimit = company?.subscription?.branch_limit || 3;

      if (!requestedLimit || requestedLimit <= currentLimit) {
        setEstimatedPricing(null);
        return;
      }

      setLoadingPricing(true);
      try {
        // Use the pro-rated pricing endpoint
        const response = await axiosInstance.post('/companies/pricing/calculate-prorated-upgrade', {
          new_branches: requestedLimit,
        });
        setEstimatedPricing(response.data);
      } catch (error) {
        console.error('Failed to calculate pricing:', error);
        setEstimatedPricing(null);
      } finally {
        setLoadingPricing(false);
      }
    };

    if (showUpgradeModal && upgradeForm.requested_limit) {
      fetchPricing();
    }
  }, [upgradeForm.requested_limit, showUpgradeModal, company?.subscription?.branch_limit]);

  const handleSubmitUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    const currentLimit = company?.subscription?.branch_limit || 3;
    const requestedLimit = parseInt(upgradeForm.requested_limit);

    if (requestedLimit <= currentLimit) {
      alert(`Requested limit must be greater than current limit (${currentLimit})`);
      return;
    }

    requestUpgradeMutation.mutate({
      requested_limit: requestedLimit,
      reason: upgradeForm.reason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subscription = company?.subscription;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCardIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Account & Subscription</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your subscription and account settings</p>
        </div>
      </div>

      {/* Expiry Alert */}
      {subscription && typeof subscription.days_until_expiry === 'number' && subscription.days_until_expiry <= 7 && (
        <div className="glass-card p-6 border-l-4 border-danger">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-danger flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
                ⚠️ Subscription Expiring Soon!
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                Your {subscription.status === 'trial' ? 'trial' : 'subscription'} expires in{' '}
                <span className="font-bold text-lg text-danger">{subscription.days_until_expiry} days</span>.
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Please contact your administrator to renew your subscription and avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Overview */}
      {subscription && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Subscription Details</h2>
                <p className="text-sm text-slate-400">Your current plan and usage</p>
              </div>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${
              subscription.status === 'trial' ? 'badge-info' :
              subscription.status === 'active' ? 'badge-success' :
              'badge-danger'
            }`}>
              {subscription.status.toUpperCase()}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <BuildingOfficeIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">Branch Limit</p>
              <p className="text-3xl font-bold text-slate-100">{subscription.branch_limit}</p>
              <p className="text-xs text-slate-500 mt-1">
                {company?.stats.total_branches || 0} in use
              </p>
            </div>
            
            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <CalendarIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">Days Remaining</p>
              <p className={`text-3xl font-bold ${
                typeof subscription.days_until_expiry === 'number' && subscription.days_until_expiry <= 7 
                  ? 'text-danger' 
                  : 'text-success'
              }`}>
                {subscription.days_until_expiry !== null && subscription.days_until_expiry !== undefined ? subscription.days_until_expiry : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Until expiry</p>
            </div>

            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <BanknotesIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">Payments Made</p>
              <p className="text-3xl font-bold text-slate-100">{subscription.payment_history.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total transactions</p>
            </div>

            <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">Upgrade Requests</p>
              <p className="text-3xl font-bold text-slate-100">{upgradeRequests?.length || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Submitted</p>
            </div>
          </div>

          {/* Subscription Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                {subscription.status === 'trial' ? '🎯 Trial Start Date' : '📅 Subscription Start'}
              </p>
              <p className="text-base text-slate-200">
                {subscription.status === 'trial' && subscription.trial_start_date
                  ? new Date(subscription.trial_start_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : subscription.subscription_start_date
                  ? new Date(subscription.subscription_start_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                {subscription.status === 'trial' ? '⏰ Trial End Date' : '📆 Subscription End'}
              </p>
              <p className="text-base text-slate-200 font-semibold">
                {subscription.status === 'trial' && subscription.trial_end_date
                  ? new Date(subscription.trial_end_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : subscription.subscription_end_date
                  ? new Date(subscription.subscription_end_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Branch Usage Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
              <span className="font-medium">Branch Usage</span>
              <span className="font-semibold">
                {company?.stats.total_branches || 0} / {subscription.branch_limit} branches
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all flex items-center justify-end pr-2 ${
                  (company?.stats.total_branches || 0) >= subscription.branch_limit
                    ? 'bg-danger'
                    : (company?.stats.total_branches || 0) / subscription.branch_limit > 0.8
                    ? 'bg-warning'
                    : 'bg-success'
                }`}
                style={{
                  width: `${Math.min(
                    ((company?.stats.total_branches || 0) / subscription.branch_limit) * 100,
                    100
                  )}%`,
                }}
              >
                <span className="text-xs font-bold text-white">
                  {Math.round(((company?.stats.total_branches || 0) / subscription.branch_limit) * 100)}%
                </span>
              </div>
            </div>
            {(company?.stats.total_branches || 0) >= subscription.branch_limit && (
              <div className="mt-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-sm text-danger">
                  ⚠️ You've reached your branch limit. Request an upgrade to add more branches.
                </p>
              </div>
            )}
          </div>

          {/* Request Upgrade Button */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <ArrowTrendingUpIcon className="w-5 h-5" />
              Request Branch Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {subscription && subscription.payment_history.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <BanknotesIcon className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {subscription.payment_history.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                      {payment.reference_number || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-success">
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-400">
              💰 Total Paid: <span className="font-bold">
                {formatCurrency(subscription.payment_history.reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Requests */}
      {upgradeRequests && upgradeRequests.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Branch Upgrade Requests</h3>
          </div>
          <div className="space-y-3">
            {upgradeRequests.map((request) => (
              <div key={request.id} className="p-4 border-2 border-slate-700 rounded-lg hover:border-primary/50 transition-colors bg-slate-800/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        request.status === 'pending' ? 'badge-warning' :
                        request.status === 'approved' ? 'badge-success' :
                        'badge-danger'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        {request.current_limit} → {request.requested_limit} branches
                      </span>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-slate-400 mb-2 italic">"{request.reason}"</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        Requested: {new Date(request.requested_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      {request.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Reviewed: {new Date(request.reviewed_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    {request.rejection_reason && (
                      <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <p className="text-sm font-medium text-danger mb-1">❌ Rejection Reason:</p>
                        <p className="text-sm text-slate-300">{request.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {request.status === 'pending' && <ClockIcon className="w-8 h-8 text-warning" />}
                    {request.status === 'approved' && <CheckCircleIcon className="w-8 h-8 text-success" />}
                    {request.status === 'rejected' && <XCircleIcon className="w-8 h-8 text-danger" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Information */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Company Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Company Name</p>
              <p className="text-base font-semibold text-slate-100">{company?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                company?.status === 'active' ? 'badge-success' : 'badge-danger'
              }`}>
                {company?.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Company ID</p>
              <p className="text-sm font-mono text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">{company?.id}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Created On</p>
              <p className="text-base font-semibold text-slate-100">
                {company?.created_at ? new Date(company.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Branches</p>
              <p className="text-2xl font-bold text-primary-400">{company?.stats.total_branches || 0}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Borrowers</p>
              <p className="text-2xl font-bold text-success">{company?.stats.total_borrowers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <UserIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Owner Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <UserIcon className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 mb-1">Name</p>
              <p className="text-sm font-medium text-slate-200">{user?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <EnvelopeIcon className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 mb-1">Email</p>
              <p className="text-sm font-medium text-slate-200">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <PhoneIcon className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 mb-1">Phone</p>
              <p className="text-sm font-medium text-slate-200">{user?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Request Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100">Request Branch Upgrade</h3>
            </div>
            <form onSubmit={handleSubmitUpgrade} className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Current Branch Limit</p>
                <p className="text-3xl font-bold text-primary-400">{subscription?.branch_limit}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {company?.stats.total_branches || 0} branches in use
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Requested Limit *
                </label>
                <input
                  type="number"
                  required
                  min={(subscription?.branch_limit || 3) + 1}
                  value={upgradeForm.requested_limit}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, requested_limit: e.target.value })}
                  className="input-field"
                  placeholder="Enter new branch limit"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must be greater than {subscription?.branch_limit}
                </p>
              </div>

              {/* Estimated Pricing */}
              {loadingPricing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-3 text-sm text-slate-400">Calculating pricing...</span>
                </div>
              )}

              {estimatedPricing && !loadingPricing && (
                <div className="space-y-3">
                  {/* Branch Info */}
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Limit:</span>
                      <span className="font-semibold text-slate-200">{estimatedPricing.current_branches} branches</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">New Limit:</span>
                      <span className="font-semibold text-primary-400">{estimatedPricing.new_branches} branches</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Additional Branches:</span>
                      <span className="font-semibold text-slate-200">+{estimatedPricing.additional_branches}</span>
                    </div>
                  </div>

                  {/* Pro-Rated Info */}
                  {estimatedPricing.is_prorated && (
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-green-400 text-lg">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-400 mb-1">Pro-Rated Pricing Applied!</p>
                          <p className="text-xs text-slate-300">{estimatedPricing.explanation}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-500/20 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Remaining Time:</span>
                          <span className="font-medium text-slate-200">
                            {estimatedPricing.remaining_days} days ({estimatedPricing.remaining_months} months)
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Full Price Difference:</span>
                          <span className="font-medium text-slate-200">{formatCurrency(estimatedPricing.price_difference || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <CurrencyRupeeIcon className="w-4 h-4" />
                      New Annual Price Breakdown
                    </h4>
                    <div className="space-y-2">
                      {estimatedPricing.breakdown?.map((tier: any) => (
                        <div key={tier.tier} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                              Tier {tier.tier}
                            </span>
                            <span className="text-slate-400">
                              {tier.branches} × {formatCurrency(tier.price_per_branch)}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-200">
                            {formatCurrency(tier.tier_total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Annual Price:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(estimatedPricing.current_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">New Annual Price:</span>
                      <span className="font-semibold text-primary-400">{formatCurrency(estimatedPricing.new_annual_price || 0)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-slate-300">
                            {estimatedPricing.is_prorated ? 'Pro-Rated Amount to Pay:' : 'Amount to Pay:'}
                          </span>
                          {estimatedPricing.is_prorated && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              For remaining {estimatedPricing.remaining_months} months
                            </p>
                          )}
                        </div>
                        <span className="text-xl font-bold text-green-400">
                          {formatCurrency(estimatedPricing.prorated_amount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                    <p className="text-xs text-yellow-400">
                      💡 {estimatedPricing.is_prorated 
                        ? 'You only pay for the remaining subscription period. Your subscription end date stays the same.'
                        : 'This is an estimated price. Final pricing will be confirmed by the superadmin upon approval.'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={upgradeForm.reason}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, reason: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Explain why you need more branches..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Providing a reason helps speed up the approval process
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setUpgradeForm({ requested_limit: '', reason: '' });
                    setEstimatedPricing(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={requestUpgradeMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={requestUpgradeMutation.isPending}
                >
                  {requestUpgradeMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
