import axiosInstance from './axiosInstance';

export interface OverdueBorrower {
  borrower_id: string;
  branch_id: string;
  name: string;
  phone: string;
  next_due_date: string;
  monthly_emi: number;
  outstanding_balance: number;
  days_overdue: number;
}

export interface UpcomingDue {
  borrower_id: string;
  name: string;
  phone: string;
  next_due_date: string;
  monthly_emi: number;
  days_until_due: number;
}

export const reportApi = {
  getCompanyReport: async (branchId?: string, fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    
    const response = await axiosInstance.get(`/reports/company?${params.toString()}`);
    return response.data;
  },

  getBranchReport: async (branchId: string, fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    
    const response = await axiosInstance.get(`/reports/branch/${branchId}?${params.toString()}`);
    return response.data;
  },

  getOverdue: async (): Promise<OverdueBorrower[]> => {
    const response = await axiosInstance.get('/reports/overdue');
    return response.data;
  },

  getUpcomingDues: async (): Promise<UpcomingDue[]> => {
    const response = await axiosInstance.get('/reports/upcoming-dues');
    return response.data;
  },
};
