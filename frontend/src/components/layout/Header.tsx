import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { investigationsAPI } from '../../services/api';
import { Investigation } from '../../types';
import { Search, LogOut, Menu, ShieldAlert } from 'lucide-react';
import { Badge } from '../common/Badge';

interface HeaderProps {
  currentInvestigationId: string | null;
  onSelectInvestigation: (inv: Investigation) => void;
  onSearchQuery?: (q: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentInvestigationId,
  onSelectInvestigation,
  onSearchQuery,
  onToggleMobileMenu
}) => {
  const { user, logout } = useAuth();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    try {
      const list = await investigationsAPI.list();
      setInvestigations(list);
      if (list.length > 0 && !currentInvestigationId) {
        onSelectInvestigation(list[0]);
      }
    } catch (err) {
      console.error('Failed to load investigations from PostgreSQL:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchQuery) {
      onSearchQuery(search);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Mobile Menu Toggle & Case Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold hidden sm:inline">Active Case</span>
          <select
            value={currentInvestigationId || ''}
            onChange={(e) => {
              const selected = investigations.find((i) => i.id === e.target.value);
              if (selected) onSelectInvestigation(selected);
            }}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 max-w-[200px] sm:max-w-[280px] truncate"
          >
            {investigations.length === 0 ? (
              <option value="">No cases created yet</option>
            ) : (
              investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.severity})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Center: Search input */}
      <form onSubmit={handleSearchSubmit} className="hidden lg:block relative w-80 xl:w-96">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search investigation logs (e.g. Rahul, critical, 192.168.1.1)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
        />
      </form>

      {/* Right: User profile */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 md:pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{user.name}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
