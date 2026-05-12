import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './store';
import { queryClient } from './cache/queryClient';
import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionBanner from './components/SubscriptionBanner';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Borrowers from './pages/Borrowers';
import AddBorrower from './pages/AddBorrower';
import AddAdditionalLoan from './pages/AddAdditionalLoan';
import BorrowerDetail from './pages/BorrowerDetail';
import LoanDetails from './pages/LoanDetails';
import RecentLoans from './pages/RecentLoans';
import BorrowerAssignments from './pages/BorrowerAssignments';
import AssignmentDetails from './pages/AssignmentDetails';
import MyAssignments from './pages/MyAssignments';
import Payments from './pages/Payments';
import PendingDues from './pages/PendingDues';
import Branches from './pages/Branches';
import CreateBranch from './pages/CreateBranch';
import Workers from './pages/Workers';
import Users from './pages/Users';
import CompanySettings from './pages/CompanySettings';
import Reports from './pages/Reports';
import Account from './pages/Account';
import GoldLockers from './pages/GoldLockers';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                <Route
                  path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.theme);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_22%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.85))] dark:bg-none" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <SubscriptionBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">{/* Rest of routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<EnhancedDashboard />} />
            <Route path="/borrowers" element={<Borrowers />} />
            <Route path="/borrowers/add" element={<AddBorrower />} />
            <Route path="/borrowers/:id/add-loan" element={<AddAdditionalLoan />} />
            <Route path="/borrowers/:borrowerId/loans/:loanId" element={<LoanDetails />} />
            <Route path="/borrowers/assignments" element={<BorrowerAssignments />} />
            <Route path="/borrowers/:id" element={<BorrowerDetail />} />
            <Route path="/recent-loans" element={<ProtectedRoute allowedRoles={['owner', 'branch_admin']}><RecentLoans /></ProtectedRoute>} />
            <Route path="/assignment-details" element={<ProtectedRoute allowedRoles={['owner', 'branch_admin']}><AssignmentDetails /></ProtectedRoute>} />
            <Route path="/my-assignments" element={<ProtectedRoute allowedRoles={['worker']}><MyAssignments /></ProtectedRoute>} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/pending-dues" element={<PendingDues />} />
            <Route path="/branches" element={<ProtectedRoute allowedRoles={['owner']}><Branches /></ProtectedRoute>} />
            <Route path="/branches/create" element={<ProtectedRoute allowedRoles={['owner']}><CreateBranch /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['owner']}><Users /></ProtectedRoute>} />
            <Route path="/workers" element={<ProtectedRoute allowedRoles={['branch_admin']}><Workers /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute allowedRoles={['owner']}><Account /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['owner']}><CompanySettings /></ProtectedRoute>} />
            <Route path="/gold-lockers" element={<ProtectedRoute allowedRoles={['owner', 'branch_admin']}><GoldLockers /></ProtectedRoute>} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
