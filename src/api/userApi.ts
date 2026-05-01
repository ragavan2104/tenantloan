import axiosInstance from './axiosInstance';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
  branch_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  branch_id?: string | null;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await axiosInstance.get('/users/all');
    return response.data;
  },

  getBranchWorkers: async (): Promise<User[]> => {
    const response = await axiosInstance.get('/users');
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await axiosInstance.post('/users/create', data);
    return response.data;
  },

  createBranchWorker: async (data: CreateUserRequest): Promise<User> => {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateUserRequest & { is_active?: boolean }>): Promise<User> => {
    const response = await axiosInstance.put(`/users/update/${id}`, data);
    return response.data;
  },

  updateBranchWorker: async (id: string, data: Partial<CreateUserRequest & { is_active?: boolean }>): Promise<User> => {
    const response = await axiosInstance.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/delete/${id}`);
  },

  deleteBranchWorker: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },
};
