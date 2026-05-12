import axiosInstance from './axiosInstance';

export interface SubscriptionPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  recorded_by: string;
  status: string;
}

export interface Subscription {
  status: string;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  branch_limit: number;
  payment_history: SubscriptionPayment[];
  days_until_expiry?: number;
}

export interface Company {
  id: string;
  name: string;
  status: string;
  created_at: string;
  subscription?: Subscription;
  settings?: {
    interest_rate: number;
    interest_type: string;
    due_date_of_month: number;
    late_penalty_rate: number;
    penalty_enabled: boolean;
    penalty_calculation_base: string;
    grace_period_days: number;
    loan_type_settings?: {
      personal: { interest_rate: number; interest_type: string };
      bike: { interest_rate: number; interest_type: string };
      car: { interest_rate: number; interest_type: string };
      gold: { interest_rate: number; interest_type: string };
    };
    gold_rates?: {
      '18K': number;
      '22K': number;
      '24K': number;
    };
    max_gold_loan_amount?: number;
  };
  stats: {
    total_branches: number;
    active_branches: number;
    total_borrowers: number;
    total_outstanding: number;
    collections_this_month: number;
    total_overdue: number;
    total_overdue_amount: number;
  };
}

export interface BranchUpgradeRequest {
  id: string;
  requested_limit: number;
  current_limit: number;
  reason?: string;
  requested_at: string;
  requested_by: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export const companyApi = {
  getById: async (id: string): Promise<Company> => {
    const response = await axiosInstance.get(`/companies/${id}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await axiosInstance.get(`/companies/${id}/stats`);
    return response.data;
  },

  updateSettings: async (id: string, settings: any) => {
    const response = await axiosInstance.put(`/companies/${id}/settings`, settings);
    return response.data;
  },

  // Branch upgrade requests (Owner only)
  requestBranchUpgrade: async (companyId: string, data: { requested_limit: number; reason?: string }): Promise<BranchUpgradeRequest> => {
    const response = await axiosInstance.post(`/companies/${companyId}/branch-upgrade-request`, data);
    return response.data;
  },

  getUpgradeRequests: async (companyId: string): Promise<BranchUpgradeRequest[]> => {
    const response = await axiosInstance.get(`/companies/${companyId}/branch-upgrade-requests`);
    return response.data;
  },
};
