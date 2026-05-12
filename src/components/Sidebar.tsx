import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
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
  LockClosedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  const [goldMenuOpen, setGoldMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  
  // Check if any gold submenu item is active
  const isGoldSectionActive = () => {
    return location.pathname === '/gold-loans' || 
           location.pathname === '/pending-gold-dues' || 
           location.pathname === '/gold-lockers' ||
           location.pathname.startsWith('/gold-loans/');
  };

  // Menu items based on role
  const getMenuItems = () => {
    // Owner (Main Admin) - Can see everything across all branches
    if (user?.role === 'owner') {
      return [
        { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { path: '/branches', icon: BuildingOfficeIcon, label: 'Branches' },
        { path: '/users', icon: UsersIcon, label: 'Users' },
        { path: '/borrowers', icon: UserGroupIcon, label: 'All Borrowers' },
        { type: 'gold-menu', icon: LockClosedIcon, label: '💰 Gold', isGold: true },
        { path: '/recent-loans', icon: ClockIcon, label: 'Recent Loans' },
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
        { type: 'gold-menu', icon: LockClosedIcon, label: '💰 Gold', isGold: true },
        { path: '/recent-loans', icon: ClockIcon, label: 'Recent Loans' },
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
        { type: 'gold-menu', icon: LockClosedIcon, label: '💰 Gold', isGold: true },
        { path: '/pending-dues', icon: ClockIcon, label: 'Pending Dues' },
        { path: '/payments', icon: CurrencyRupeeIcon, label: 'Payments' },
      ];
    }

    return [];
  };

  const goldSubMenuItems = [
    { path: '/gold-loans', label: 'Gold Loans' },
    { path: '/pending-gold-dues', label: 'Pending Gold Dues' },
    { path: '/gold-lockers', label: 'Gold Lockers' },
  ];

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full 
          z-50 w-64 transition-transform duration-300 ease-in-out
          border-r border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <div className="flex h-full flex-col overflow-hidden bg-transparent">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 p-6 dark:border-zinc-800">
            <div>
              <h1 className="text-xl font-bold text-primary">Lend Flow</h1>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              // Handle Gold Menu with dropdown
              if (item.type === 'gold-menu') {
                const Icon = item.icon;
                const isGoldActive = isGoldSectionActive();
                
                return (
                  <div key={`gold-menu-${index}`}>
                    <button
                      onClick={() => setGoldMenuOpen(!goldMenuOpen)}
                      className={`
                        w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-200
                        ${isGoldActive
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/20'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {goldMenuOpen ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {goldMenuOpen && (
                      <div className="mt-1 ml-4 space-y-1 border-l-2 border-amber-500/30 pl-4">
                        {goldSubMenuItems.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => onClose()}
                            className={`
                              block rounded-lg px-4 py-2 text-sm transition-all duration-200
                              ${isActive(subItem.path)
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'
                              }
                            `}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Handle regular menu items
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
                    ${isActive(item.path)
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800/80'
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
          <div className="flex-shrink-0 space-y-2 border-t border-slate-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between rounded-xl px-4 py-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800/80"
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
