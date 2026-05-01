import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { borrowerApi } from '../api/borrowerApi';
import { userApi } from '../api/userApi';
import { paymentApi } from '../api/paymentApi';
import { ArrowLeftIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
// import * as XLSX from 'xlsx'; // TODO: Install xlsx package if needed

interface BorrowerWithPayments {
  id: string;
  name: string;
  phone: string;
  address: string;
  loan_amount?: number;
  monthly_emi?: number;
  outstanding_balance?: number;
  next_due_date?: string | null;
  loan_status?: string;
  hasCollectedThisMonth: boolean;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  totalPaid: number;
}

const WorkerBorrowerDetails = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch worker details
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: userApi.getAll,
  });

  const worker = allUsers?.find(u => u.id === workerId);

  // Fetch all borrowers
  const { data: borrowers, isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: () => borrowerApi.getAll(),
  });

  // Filter borrowers assigned to this worker
  const assignedBorrowers = borrowers?.filter(b => b.assigned_to === workerId) || [];

  // Fetch payments for each borrower
  const { data: paymentsData } = useQuery({
    queryKey: ['worker-payments', workerId],
    queryFn: async () => {
      const payments: Record<string, any[]> = {};
      for (const borrower of assignedBorrowers) {
        try {
          const borrowerPayments = await paymentApi.getByBorrower(borrower.id);
          payments[borrower.id] = borrowerPayments;
        } catch (error) {
          payments[borrower.id] = [];
        }
      }
      return payments;
    },
    enabled: assignedBorrowers.length > 0,
  });

  // Process borrowers with payment info
  const borrowersWithPayments: BorrowerWithPayments[] = assignedBorrowers.map(borrower => {
    const payments = paymentsData?.[borrower.id] || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if collected this month
    const hasCollectedThisMonth = payments.some(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    // Get last payment
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    const lastPayment = sortedPayments[0];

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...borrower,
      hasCollectedThisMonth,
      lastPaymentDate: lastPayment?.payment_date || null,
      lastPaymentAmount: lastPayment?.amount || null,
      totalPaid,
    };
  });

  // Filter borrowers
  const filteredBorrowers = borrowersWithPayments.filter(b =>
    searchTerm === '' ||
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  // Calculate stats
  const collectedCount = filteredBorrowers.filter(b => b.hasCollectedThisMonth).length;
  const pendingCount = filteredBorrowers.length - collectedCount;
  const totalOutstanding = filteredBorrowers.reduce((sum, b) => sum + b.outstanding_balance, 0);
  // const totalCollectedThisMonth = filteredBorrowers
  //   .filter(b => b.hasCollectedThisMonth)
  //   .reduce((sum, b) => sum + (b.lastPaymentAmount || 0), 0);

  // Export to Excel
  const handleExport = () => {
    // TODO: Install xlsx package to enable export functionality
    alert('Export functionality requires xlsx package. Please install it first.');
    /*
    const exportData = filteredBorrowers.map(b => ({
      'Borrower Name': b.name,
      'Phone': b.phone,
      'Address': b.address,
      'Loan Amount': b.loan_amount,
      'Monthly EMI': b.monthly_emi,
      'Outstanding Balance': b.outstanding_balance,
      'Total Paid': b.totalPaid,
      'Next Due Date': b.next_due_date || 'N/A',
      'Collected This Month': b.hasCollectedThisMonth ? 'Yes' : 'No',
      'Last Payment Date': b.lastPaymentDate || 'N/A',
      'Last Payment Amount': b.lastPaymentAmount || 0,
      'Status': b.loan_status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Borrowers');

    // Auto-size columns
    const maxWidth = 20;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, 10))
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${worker?.name || 'Worker'}_Borrowers_${new Date().toISOString().split('T')[0]}.xlsx`);
    */
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-400">Worker not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/borrower-assignments')}
            className="btn-secondary p-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{worker.name}</h1>
            <p className="text-slate-400 mt-1">{worker.email} • {assignedBorrowers.length} borrowers assigned</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredBorrowers.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Borrowers</p>
          <p className="text-2xl font-bold text-slate-100">{filteredBorrowers.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Collected This Month</p>
          <p className="text-2xl font-bold text-success">{collectedCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Pending Collection</p>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-danger">₹{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or phone..."
          className="input-field w-full"
        />
      </div>

      {/* Borrowers Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-zinc-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Monthly EMI
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  This Month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Last Payment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {filteredBorrowers.map((borrower) => (
                <tr key={borrower.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-100">{borrower.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{borrower.address}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-300">{borrower.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-medium text-slate-100">
                      ₹{borrower.monthly_emi.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-medium text-warning">
                      ₹{borrower.outstanding_balance.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {borrower.hasCollectedThisMonth ? (
                      <div className="flex items-center justify-center gap-1 text-success">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-xs font-medium">Collected</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-danger">
                        <XCircleIcon className="w-5 h-5" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {borrower.lastPaymentDate ? (
                      <div>
                        <p className="text-sm text-slate-300">
                          {new Date(borrower.lastPaymentDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-success">
                          ₹{borrower.lastPaymentAmount?.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No payments</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      borrower.loan_status === 'active' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-zinc-700 text-slate-400'
                    }`}>
                      {borrower.loan_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBorrowers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No borrowers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerBorrowerDetails;
