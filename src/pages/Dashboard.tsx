import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useQuery } from '@tanstack/react-query';
import { borrowerApi } from '../api/borrowerApi';

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: recentActivity, isLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => borrowerApi.getRecentActivity(15),
  });

  return (
    <div className="min-h-screen bg-surface-dark p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 sm:p-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
            Welcome to Dashboard
          </h1>
          <p className="text-slate-400 mb-2">
            Role: <span className="text-primary capitalize">{user?.role}</span>
          </p>
        </div>

        {/* Recent Borrower Activity */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-100 dark:text-slate-100 mb-6">Recent Borrower Activity</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-slate-400 mt-2">Loading activity...</p>
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Borrower</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Branch</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-medium">Loan Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {new Date(activity.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{activity.borrower_name}</td>
                      <td className="py-3 px-4 text-slate-400">{activity.phone}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                          {activity.branch_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200 font-medium">
                        ₹{activity.loan_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
