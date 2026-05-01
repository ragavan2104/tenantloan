import axiosInstance from './axiosInstance';

export interface AssignBorrowerRequest {
  worker_id: string | null;
}

export interface BulkAssignRequest {
  assignments: Array<{
    borrower_id: string;
    worker_id: string | null;
  }>;
}

export const assignmentApi = {
  // Assign single borrower to worker
  assignBorrower: async (borrowerId: string, workerId: string | null) => {
    const response = await axiosInstance.post(`/borrowers/${borrowerId}/assign`, {
      worker_id: workerId
    });
    return response.data;
  },

  // Bulk assign borrowers
  bulkAssign: async (assignments: Array<{ borrower_id: string; worker_id: string | null }>) => {
    const response = await axiosInstance.post('/borrowers/bulk-assign', {
      assignments
    });
    return response.data;
  },

  // Get unassigned borrowers
  getUnassigned: async () => {
    const response = await axiosInstance.get('/borrowers/unassigned');
    return response.data;
  },

  // Unassign borrower
  unassignBorrower: async (borrowerId: string) => {
    const response = await axiosInstance.post(`/borrowers/${borrowerId}/unassign`);
    return response.data;
  },
};
