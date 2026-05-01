import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-slate-300" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Dashboard</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg relative transition-colors">
            <BellIcon className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
