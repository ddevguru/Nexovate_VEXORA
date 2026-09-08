import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './services/auth';
import { Investigation, SecurityEvent } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EventDetailDrawer } from './components/timeline/EventDetailDrawer';
import { WhySuspiciousModal } from './components/timeline/WhySuspiciousModal';
import { AIAssistantModal } from './components/ai/AIAssistantModal';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Investigations } from './pages/Investigations';
import { Evidence } from './pages/Evidence';
import { TimelinePage } from './pages/TimelinePage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AttackGraphPage } from './pages/AttackGraphPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Interactive Modals / Drawers State
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [whySuspiciousEvent, setWhySuspiciousEvent] = useState<SecurityEvent | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center text-blue-600 font-sans text-sm font-medium">
        Loading CYBERTRACE Platform...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Login Page */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected Dashboard Application Workspace Routes */}
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="flex h-screen bg-[#f4f6f9] text-slate-900 overflow-hidden">
              {/* Sidebar Navigation */}
              <Sidebar
                onOpenAIModal={() => setIsAIModalOpen(true)}
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
              />

              {/* Main Workspace Layout */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                  currentInvestigationId={currentInvestigation?.id || null}
                  onSelectInvestigation={(inv) => setCurrentInvestigation(inv)}
                  onSearchQuery={(q) => {
                    navigate('/timeline');
                  }}
                  onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
                />

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                  <Routes>
                    <Route
                      path="dashboard"
                      element={
                        <Dashboard
                          investigationId={currentInvestigation?.id || null}
                          onSelectEvent={(e) => setSelectedEvent(e)}
                          onWhySuspicious={(e) => setWhySuspiciousEvent(e)}
                        />
                      }
                    />
                    <Route
                      path="investigations"
                      element={
                        <Investigations
                          onSelectInvestigation={(inv) => {
                            setCurrentInvestigation(inv);
                            navigate('/dashboard');
                          }}
                        />
                      }
                    />
                    <Route
                      path="evidence"
                      element={<Evidence investigationId={currentInvestigation?.id || null} />}
                    />
                    <Route
                      path="timeline"
                      element={
                        <TimelinePage
                          investigationId={currentInvestigation?.id || null}
                          onSelectEvent={(e) => setSelectedEvent(e)}
                          onWhySuspicious={(e) => setWhySuspiciousEvent(e)}
                        />
                      }
                    />
                    <Route
                      path="incidents"
                      element={<IncidentsPage investigationId={currentInvestigation?.id || null} />}
                    />
                    <Route
                      path="attack-graph"
                      element={<AttackGraphPage investigationId={currentInvestigation?.id || null} />}
                    />
                    <Route
                      path="analytics"
                      element={<AnalyticsPage investigationId={currentInvestigation?.id || null} />}
                    />
                    <Route
                      path="reports"
                      element={<ReportsPage investigationId={currentInvestigation?.id || null} />}
                    />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>

              {/* Drawers & Modals */}
              <EventDetailDrawer
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onWhySuspicious={(ev) => {
                  setSelectedEvent(null);
                  setWhySuspiciousEvent(ev);
                }}
              />

              <WhySuspiciousModal
                event={whySuspiciousEvent}
                onClose={() => setWhySuspiciousEvent(null)}
              />

              <AIAssistantModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                investigationId={currentInvestigation?.id || null}
              />
            </div>
          )
        }
      />
    </Routes>
  );
};
export default App;
