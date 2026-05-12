import axiosInstance from './axiosInstance';

export interface GoldItem {
  description: string;
  weight_grams: number;
  purity: '18K' | '22K' | '24K';
}

export interface CollateralDetails {
  // For bike/car loans
  vehicle_make?: string;
  vehicle_model?: string;
  registration_number?: string;
  rc_book_number?: string;
  year?: number;
  vehicle_value?: number;
  down_payment?: number;
  
  // For gold loans
  gold_items?: GoldItem[];
  total_gold_weight?: number;
  gold_rate_per_gram?: number;
  ltv_percentage?: number;
  storage_location?: string;
  locker_number?: string;
  gold_value?: number;
}

export interface Loan {
  id: string;
  borrower_id: string;
  loan_number: number;
  loan_type?: 'personal' | 'bike' | 'car' | 'gold';
  repayment_type?: 'emi' | 'bullet';
  collateral?: CollateralDetails;
  loan_amount: number;
  interest_rate: number;
  interest_type: string;
  tenure_months: number;
  monthly_emi: number;
  total_payable: number;
  amount_paid: number;
  outstanding_balance: number;
  start_date: string;
  maturity_date?: string | null;
  next_due_date: string | null;
  loan_status: string;
  added_by: string;
  created_at: string;
}

export interface LoanSummary {
  borrower_id: string;
  borrower_name: string;
  borrower_phone: string;
  total_loans: number;
  active_loans: number;
  completed_loans: number;
  total_outstanding: number;
  total_monthly_emi: number;
  loans: Loan[];
}

export interface AddLoanRequest {
  loan_amount: number;
  tenure_months: number;
  start_date: string;
  loan_type?: 'personal' | 'bike' | 'car' | 'gold';
  repayment_type?: 'emi' | 'bullet';
  collateral?: CollateralDetails;
  borrower_name?: string;
}

export interface SettleLoanRequest {
  payment_mode: string;
  transaction_ref?: string;
  notes?: string;
}

export const loanApi = {
  // Get all loans for a borrower
  getBorrowerLoans: async (borrowerId: string): Promise<LoanSummary> => {
    const response = await axiosInstance.get(`/loans/borrower/${borrowerId}`);
    return response.data;
  },

  // Add a new loan to a borrower
  addLoan: async (borrowerId: string, data: AddLoanRequest): Promise<Loan> => {
    const response = await axiosInstance.post(
      `/loans/borrower/${borrowerId}/add`,
      data  // Send data in request body instead of query params
    );
    return response.data;
  },

  // Settle a specific loan
  settleLoan: async (loanId: string, data: SettleLoanRequest): Promise<any> => {
    const response = await axiosInstance.post(
      `/loans/${loanId}/settle`,
      null,
      {
        params: {
          payment_mode: data.payment_mode,
          transaction_ref: data.transaction_ref,
          notes: data.notes,
        },
      }
    );
    return response.data;
  },

  // Calculate EMI or bullet payment
  calculate: async (data: {
    principal: number;
    interest_rate: number;
    interest_type: string;
    tenure_months: number;
    repayment_type?: 'emi' | 'bullet';
  }): Promise<any> => {
    const response = await axiosInstance.post('/loans/calculate', data);
    const payload = response.data || {};
    return {
      ...payload,
      // Backend returns `monthly_payment`; frontend pages consume `monthly_emi`.
      monthly_emi: payload.monthly_emi ?? payload.monthly_payment ?? 0,
    };
  },

  // Get loan schedule
  getSchedule: async (borrowerId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/borrowers/${borrowerId}/schedule`);
    return response.data;
  },

  // Get loan summary (existing endpoint)
  getSummary: async (borrowerId: string): Promise<any> => {
    const response = await axiosInstance.get(`/loans/${borrowerId}/summary`);
    return response.data;
  },

  // Get recent loans (Admin/Owner only)
  getRecentLoans: async (days: number = 30, limit: number = 50): Promise<any> => {
    const response = await axiosInstance.get(`/loans/recent?days=${days}&limit=${limit}`);
    return response.data;
  },
};
