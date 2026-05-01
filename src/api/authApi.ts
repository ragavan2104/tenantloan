import axiosInstance from './axiosInstance';

export interface Company {
  id: string;
  name: string;
  status: string;
}

export interface LoginRequest {
  company_id: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  company_id: string;
  branch_id: string | null;
  must_change_password: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
  company_id: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export const authApi = {
  getCompanies: async (): Promise<Company[]> => {
    const response = await axiosInstance.get('/auth/companies');
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  forgotPassword: async (request: ForgotPasswordRequest): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/forgot-password', request);
    return response.data;
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/reset-password', request);
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<MessageResponse> => {
    const response = await axiosInstance.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
