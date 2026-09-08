import React from 'react';
import { TimelineView } from '../components/timeline/TimelineView';
import { SecurityEvent } from '../types';
import { GitCommitHorizontal } from 'lucide-react';

interface TimelinePageProps {
  investigationId: string | null;
  onSelectEvent: (e: SecurityEvent) => void;
  onWhySuspicious: (e: SecurityEvent) => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  investigationId,
  onSelectEvent,
  onWhySuspicious
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <GitCommitHorizontal className="w-5 h-5 text-blue-600" /> Digital Evidence Timeline Generator
        </h2>
        <p className="text-xs text-slate-500">Official PS16 Core Engine: Chronological timeline reconstruction of security events, rule triggers, and risk scores.</p>
      </div>

      <TimelineView
        investigationId={investigationId}
        onSelectEvent={onSelectEvent}
        onWhySuspicious={onWhySuspicious}
      />
    </div>
  );
};
