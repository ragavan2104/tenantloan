import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Menu items based on role
  const getMenuItems = () => {
    // Owner (Main Admin) - Can see everything across all branches
    if (user?.role === 'owner') {
      return [
        { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { path: '/branches', icon: BuildingOfficeIcon, label: 'Branches' },
        { path: '/users', icon: UsersIcon, label: 'Users' },
        { path: '/borrowers', icon: UserGroupIcon, label: 'All Borrowers' },
        { path: '/borrowers/assignments', icon: UserGroupIcon, label: 'Assign Borrowers' },
        { path: '/assignment-details', icon: ChartBarIcon, label: 'Assignment Details' },
        { path: '/pending-dues', icon: ClockIcon, label: 'Pending Dues' },
        { path: '/payments', icon: CurrencyRupeeIcon, label: 'All Payments' },
       
        { path: '/account', icon: CreditCardIcon, label: 'Account' },
        { path: '/settings', icon: Cog6ToothIcon, label: 'Company Settings' },
      ];
    }

    // Branch Admin - Can manage their branch, NO settings access
    if (user?.role === 'branch_admin') {
      return [
        { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { path: '/borrowers', icon: UserGroupIcon, label: 'Borrowers' },
        { path: '/borrowers/assignments', icon: UserGroupIcon, label: 'Assign Borrowers' },
        { path: '/assignment-details', icon: ChartBarIcon, label: 'Assignment Details' },
        { path: '/pending-dues', icon: ClockIcon, label: 'Pending Dues' },
        { path: '/payments', icon: CurrencyRupeeIcon, label: 'Payments' },
        { path: '/workers', icon: UsersIcon, label: 'Workers' },
    
      ];
    }

    // Worker - Can only view and add borrowers/payments
    if (user?.role === 'worker') {
      return [
        { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { path: '/my-assignments', icon: UserGroupIcon, label: 'My Assignments' },
        { path: '/borrowers', icon: UserGroupIcon, label: 'Borrowers' },
        { path: '/pending-dues', icon: ClockIcon, label: 'Pending Dues' },
        { path: '/payments', icon: CurrencyRupeeIcon, label: 'Payments' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full 
          bg-zinc-900 dark:bg-zinc-900
          border-r border-zinc-800 dark:border-zinc-800
          z-50 transition-transform duration-300 ease-in-out w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-primary">Lend Flow</h1>
              <p className="text-xs text-gray-600 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">{/* Menu items */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & Logout - Fixed at bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800 space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
