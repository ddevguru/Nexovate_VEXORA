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
  Sparkles,
  Bot
} from 'lucide-react';

interface SidebarProps {
  onOpenAIModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAIModal, isMobileOpen = false, onCloseMobile }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Agent Console', path: '/agents', icon: Bot, badge: 'PRO' },
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
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-white/85 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen transition-transform duration-300 shadow-2xs ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <h1 className="font-extrabold text-white tracking-wider text-sm flex items-center gap-1.5 font-sans">
                  CYBERTRACE <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Digital Forensics Engine</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 relative overflow-hidden ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 relative z-10">
                        <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                        <span className="tracking-wide">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold relative z-10 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
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
        <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">AI Forensic Assistant</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">Evidence-grounded Q&A strictly from PostgreSQL log records.</p>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenAIModal();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch Assistant
          </button>
        </div>
          <div className="pt-2 text-center border-t border-slate-200">
            <NavLink to="/" className="text-[11px] text-slate-500 hover:text-blue-600 transition-colors font-sans">
              ← Public Landing Page
            </NavLink>
          </div>
      </aside>
    </>
  );
};
export default Sidebar;
