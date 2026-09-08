import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  GitCommitHorizontal,
  Flame,
  GitFork,
  BarChart3,
  FileSpreadsheet,
  History,
  Settings,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  onOpenAIModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAIModal, isMobileOpen = false, onCloseMobile }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Investigations', path: '/investigations', icon: FolderKanban },
    { label: 'Evidence Portal', path: '/evidence', icon: FileCheck2 },
    { label: 'Timeline Engine', path: '/timeline', icon: GitCommitHorizontal, badge: 'PS16' },
    { label: 'Incident Chain', path: '/incidents', icon: Flame },
    { label: 'Attack Graph', path: '/attack-graph', icon: GitFork },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Forensic Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Audit Logs', path: '/audit-logs', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-[#1a1a2e] border-r border-[#2a2d4a] flex flex-col justify-between shrink-0 h-screen transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#2a2d4a] bg-[#131322]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-white tracking-wider text-sm flex items-center gap-1.5 font-sans">
                  CYBERTRACE <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Digital Forensics Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                        : 'text-slate-200 hover:text-white hover:bg-[#252840] font-semibold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-400'}`} />
                        <span className="tracking-wide">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-blue-700 text-white border border-blue-400/40'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* AI Assistant Callout */}
        <div className="p-4 m-4 rounded-xl bg-[#131322] border border-[#2a2d4a] space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white">AI Forensic Assistant</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">Evidence-grounded Q&A strictly from PostgreSQL log records.</p>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenAIModal();
            }}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch Assistant
          </button>
          
          <div className="pt-2 text-center border-t border-[#2a2d4a]">
            <NavLink to="/" className="text-[11px] text-slate-400 hover:text-blue-300 transition-colors font-sans">
              ← Public Landing Page
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
