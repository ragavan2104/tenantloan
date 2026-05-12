import axiosInstance from './axiosInstance';

export interface Locker {
  id: string;
  locker_number: string;
  location: string;
  description?: string;
  status: 'available' | 'occupied';
  occupied_by?: string;
  occupied_by_name?: string;
  loan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLockerRequest {
  locker_number: string;
  location: string;
  description?: string;
}

export interface UpdateLockerRequest {
  locker_number?: string;
  location?: string;
  description?: string;
  status?: 'available' | 'occupied';
}

export const lockerApi = {
  // Get all lockers
  getAll: async (statusFilter?: string): Promise<Locker[]> => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await axiosInstance.get('/lockers', { params });
    return response.data;
  },

  // Get a specific locker
  getById: async (lockerId: string): Promise<Locker> => {
    const response = await axiosInstance.get(`/lockers/${lockerId}`);
    return response.data;
  },

  // Create a new locker
  create: async (data: CreateLockerRequest): Promise<Locker> => {
    const response = await axiosInstance.post('/lockers', data);
    return response.data;
  },

  // Update a locker
  update: async (lockerId: string, data: UpdateLockerRequest): Promise<Locker> => {
    const response = await axiosInstance.put(`/lockers/${lockerId}`, data);
    return response.data;
  },

  // Delete a locker
  delete: async (lockerId: string): Promise<void> => {
    await axiosInstance.delete(`/lockers/${lockerId}`);
  },
};
