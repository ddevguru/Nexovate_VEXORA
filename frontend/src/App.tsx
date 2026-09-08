import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './services/auth';
import { Investigation, SecurityEvent } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EventDetailDrawer } from './components/timeline/EventDetailDrawer';
import { WhySuspiciousModal } from './components/timeline/WhySuspiciousModal';
import { AIAssistantModal } from './components/ai/AIAssistantModal';
import { MouseSpotlight } from './components/common/MouseSpotlight';
import { PageMotionWrapper } from './components/common/PageMotionWrapper';

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
import { AgentsConsolePage } from './pages/AgentsConsolePage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(() => {
    const saved = localStorage.getItem('cybertrace_active_case');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleSelectInvestigation = (inv: Investigation) => {
    setCurrentInvestigation(inv);
    try {
      localStorage.setItem('cybertrace_active_case', JSON.stringify(inv));
    } catch (e) {}
  };

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
    <>
      <MouseSpotlight />
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
              <div className="flex h-screen bg-[#f4f6f9] text-slate-900 overflow-hidden relative">
                {/* Sidebar Navigation */}
                <Sidebar
                  onOpenAIModal={() => setIsAIModalOpen(true)}
                  isMobileOpen={isMobileOpen}
                  onCloseMobile={() => setIsMobileOpen(false)}
                />

                {/* Main Workspace Layout */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                  <Header
                    currentInvestigationId={currentInvestigation?.id || null}
                    onSelectInvestigation={handleSelectInvestigation}
                    onSearchQuery={(q) => {
                      navigate('/timeline');
                    }}
                    onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
                  />

                  <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <AnimatePresence mode="wait">
                      <Routes location={location} key={location.pathname}>
                        <Route
                          path="dashboard"
                          element={
                            <PageMotionWrapper>
                              <Dashboard
                                investigationId={currentInvestigation?.id || null}
                                onSelectEvent={(e) => setSelectedEvent(e)}
                                onWhySuspicious={(e) => setWhySuspiciousEvent(e)}
                              />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="agents"
                          element={
                            <PageMotionWrapper>
                              <AgentsConsolePage investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="investigations"
                          element={
                            <PageMotionWrapper>
                              <Investigations
                                onSelectInvestigation={(inv) => {
                                  handleSelectInvestigation(inv);
                                  navigate('/dashboard');
                                }}
                              />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="evidence"
                          element={
                            <PageMotionWrapper>
                              <Evidence investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="timeline"
                          element={
                            <PageMotionWrapper>
                              <TimelinePage
                                investigationId={currentInvestigation?.id || null}
                                onSelectEvent={(e) => setSelectedEvent(e)}
                                onWhySuspicious={(e) => setWhySuspiciousEvent(e)}
                              />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="incidents"
                          element={
                            <PageMotionWrapper>
                              <IncidentsPage investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="attack-graph"
                          element={
                            <PageMotionWrapper>
                              <AttackGraphPage investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="analytics"
                          element={
                            <PageMotionWrapper>
                              <AnalyticsPage investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="reports"
                          element={
                            <PageMotionWrapper>
                              <ReportsPage investigationId={currentInvestigation?.id || null} />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="audit-logs"
                          element={
                            <PageMotionWrapper>
                              <AuditLogsPage />
                            </PageMotionWrapper>
                          }
                        />
                        <Route
                          path="settings"
                          element={
                            <PageMotionWrapper>
                              <SettingsPage />
                            </PageMotionWrapper>
                          }
                        />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </AnimatePresence>
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
    </>
  );
};
export default App;
