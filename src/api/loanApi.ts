import axiosInstance from './axiosInstance';

export interface Loan {
  id: string;
  borrower_id: string;
  loan_number: number;
  loan_amount: number;
  interest_rate: number;
  interest_type: string;
  tenure_months: number;
  monthly_emi: number;
  total_payable: number;
  amount_paid: number;
  outstanding_balance: number;
  start_date: string;
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
  loan_type?: string;
  collateral?: any;
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

  // Calculate EMI (existing endpoint)
  calculate: async (data: {
    principal: number;
    interest_rate: number;
    interest_type: string;
    tenure_months: number;
  }): Promise<any> => {
    const response = await axiosInstance.post('/loans/calculate', data);
    return response.data;
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
