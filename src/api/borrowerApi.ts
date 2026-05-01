import axiosInstance from './axiosInstance';

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  address: string;
  // Loan fields - optional for compatibility with separate loans structure
  loan_amount?: number | null;
  interest_rate?: number | null;
  interest_type?: string | null;
  tenure_months?: number | null;
  monthly_emi?: number | null;
  total_payable?: number | null;
  amount_paid?: number | null;
  outstanding_balance?: number | null;
  start_date?: string | null;
  next_due_date?: string | null;
  loan_status?: string | null;
  added_by?: string;
  created_at?: string;
  branch_id?: string;
  branch_name?: string;
  assigned_to?: string;
}

export interface CreateBorrowerRequest {
  name: string;
  phone: string;
  address: string;
  loan_amount: number;
  tenure_months: number;
  start_date: string;
}

export interface Payment {
  id: string;
  borrower_id: string;
  amount: number;
  payment_type: string;
  payment_mode: string;
  transaction_ref?: string;
  collected_by: string;
  payment_date: string;
  notes?: string;
}

export interface Schedule {
  id: string;
  borrower_id: string;
  loan_id?: string;
  loan_number?: number;
  installment_no: number;
  due_date: string;
  due_amount: number;
  status: string;
  paid_on?: string;
}

export interface BorrowerHistory {
  borrower: Borrower;
  payments: Payment[];
  schedules: Schedule[];
  total_paid: number;
  payment_count: number;
}

export interface BorrowerHistoryResponse {
  found: boolean;
  phone: string;
  borrowers: BorrowerHistory[];
  total_loans: number;
  message: string;
}

export interface RecentActivity {
  type: string;
  borrower_id: string;
  borrower_name: string;
  phone: string;
  loan_amount: number;
  branch_name: string;
  branch_id: string;
  date: string;
}

export const borrowerApi = {
  getAll: async (
    limit = 50, 
    offset = 0,
    loanStatus?: string,
    branchFilter?: string,
    search?: string
  ): Promise<Borrower[]> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (loanStatus) params.append('loan_status', loanStatus);
    if (branchFilter) params.append('branch_filter', branchFilter);
    if (search) params.append('search', search);
    
    const response = await axiosInstance.get(`/borrowers?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Borrower> => {
    const response = await axiosInstance.get(`/borrowers/${id}`);
    return response.data;
  },

  create: async (data: CreateBorrowerRequest): Promise<Borrower> => {
    const response = await axiosInstance.post('/borrowers', data);
    return response.data;
  },

  search: async (query: string): Promise<Borrower[]> => {
    const response = await axiosInstance.get(`/borrowers/search?q=${query}`);
    return response.data;
  },

  getHistoryByPhone: async (phone: string): Promise<BorrowerHistoryResponse> => {
    const response = await axiosInstance.get(`/borrowers/history/phone/${phone}`);
    return response.data;
  },

  getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
    const response = await axiosInstance.get(`/borrowers/history/recent?limit=${limit}`);
    return response.data;
  },

  getPendingDues: async (params: string): Promise<any> => {
    const url = params ? `/borrowers/pending-dues-v2?${params}` : '/borrowers/pending-dues-v2';
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
