import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { companyApi } from '../api/companyApi';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const SubscriptionBanner = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [dismissed, setDismissed] = useState(false);

  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: () => companyApi.getById(user?.companyId || ''),
    enabled: !!user?.companyId && user?.role !== 'superadmin',
  });

  if (!company || dismissed) return null;

  const subscription = company.subscription;
  const status = subscription?.status;
  const daysUntilExpiry = subscription?.days_until_expiry;

  // Don't show banner for active subscriptions with more than 30 days
  if (status === 'active' && daysUntilExpiry && daysUntilExpiry > 30) {
    return null;
  }

  // Determine banner type and message
  let bannerType: 'warning' | 'error' | 'info' = 'info';
  let message = '';
  let showDismiss = true;

  if (status === 'trial') {
    if (daysUntilExpiry !== null && daysUntilExpiry !== undefined) {
      if (daysUntilExpiry <= 7) {
        bannerType = 'warning';
        message = `Trial period ending in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please contact administrator to activate subscription.`;
      } else {
        bannerType = 'info';
        message = `Trial period: ${daysUntilExpiry} days remaining`;
      }
    }
  } else if (status === 'trial_expired') {
    bannerType = 'error';
    message = 'Trial period has expired. Please contact administrator to activate subscription.';
    showDismiss = false;
  } else if (status === 'active' && daysUntilExpiry !== null && daysUntilExpiry !== undefined) {
    if (daysUntilExpiry <= 7) {
      bannerType = 'error';
      message = `Subscription expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}! Please contact administrator to renew.`;
      showDismiss = false;
    } else if (daysUntilExpiry <= 30) {
      bannerType = 'warning';
      message = `Subscription expiring in ${daysUntilExpiry} days. Please contact administrator to renew.`;
    }
  } else if (status === 'expired') {
    bannerType = 'error';
    message = 'Subscription has expired. Grace period active. Please contact administrator immediately.';
    showDismiss = false;
  } else if (status === 'blocked') {
    bannerType = 'error';
    message = 'Access blocked due to expired subscription. Please contact administrator to restore access.';
    showDismiss = false;
  }

  if (!message) return null;

  const bgColor = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  }[bannerType];

  const textColor = {
    info: 'text-blue-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
  }[bannerType];

  const iconColor = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }[bannerType];

  return (
    <div className={`${bgColor} border-b px-4 py-3 relative`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        {showDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className={`${textColor} hover:opacity-70 transition-opacity`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBanner;
