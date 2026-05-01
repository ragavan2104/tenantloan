import axiosInstance from './axiosInstance';

export interface Payment {
  id: string;
  borrower_id: string;
  loan_id?: string;
  loan_number?: number;
  amount: number;
  payment_type: string;
  payment_mode: string;
  transaction_ref: string | null;
  collected_by: string;
  payment_date: string;
  notes: string | null;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string | null;
}

export interface PaymentDetail extends Payment {
  borrower_name: string;
  collected_by_name: string;
}

export interface CreatePaymentRequest {
  borrower_id: string;
  amount: number;
  payment_type: 'due_payment' | 'full_payment';
  payment_mode?: string;
  transaction_ref?: string;
  notes?: string;
}

export const paymentApi = {
  recordDuePayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await axiosInstance.post('/payments/due', data);
    return response.data;
  },

  recordFullPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await axiosInstance.post('/payments/full', data);
    return response.data;
  },

  getAll: async (
    limit = 50, 
    offset = 0,
    paymentType?: string,
    paymentMode?: string,
    fromDate?: string,
    toDate?: string,
    branchFilter?: string
  ): Promise<PaymentDetail[]> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (paymentType) params.append('payment_type', paymentType);
    if (paymentMode) params.append('payment_mode', paymentMode);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (branchFilter) params.append('branch_filter', branchFilter);
    
    const response = await axiosInstance.get(`/payments?${params.toString()}`);
    return response.data;
  },

  getByBorrower: async (borrowerId: string): Promise<Payment[]> => {
    const response = await axiosInstance.get(`/payments/borrower/${borrowerId}`);
    return response.data;
  },
};
