import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800">
            <BellIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>
          
          <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary sm:flex">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
