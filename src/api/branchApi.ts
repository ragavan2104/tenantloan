import axiosInstance from './axiosInstance';

export interface BranchSettings {
  interest_rate: number;
  interest_type: string;
  due_date_of_month: number;
  reminder_days: number[];
  currency: string;
  late_penalty_rate: number;
  penalty_enabled?: boolean;
  penalty_calculation_base?: string;
  grace_period_days?: number;
}

export interface BranchStats {
  total_borrowers: number;
  total_outstanding: number;
  collections_this_month: number;
  overdue_count: number;
  overdue_amount: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
  branch_admin_id: string | null;
  status: string;
  settings: BranchSettings;
  stats: BranchStats;
}

export interface CreateBranchRequest {
  name: string;
  location: string;
  address: string;
}

export const branchApi = {
  getAll: async (): Promise<Branch[]> => {
    const response = await axiosInstance.get('/branches');
    return response.data;
  },

  getById: async (id: string): Promise<Branch> => {
    const response = await axiosInstance.get(`/branches/${id}`);
    return response.data;
  },

  create: async (data: CreateBranchRequest): Promise<Branch> => {
    const response = await axiosInstance.post('/branches', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBranchRequest>): Promise<Branch> => {
    const response = await axiosInstance.put(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/branches/${id}`);
  },

  getStats: async (id: string): Promise<BranchStats> => {
    const response = await axiosInstance.get(`/branches/${id}/stats`);
    return response.data;
  },

  updateSettings: async (id: string, settings: Partial<BranchSettings>): Promise<void> => {
    await axiosInstance.put(`/branches/${id}/settings`, settings);
  },
};
