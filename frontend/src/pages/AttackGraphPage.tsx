import React from 'react';
import { AttackGraphView } from '../components/attack-graph/AttackGraphView';

interface AttackGraphPageProps {
  investigationId: string | null;
}

export const AttackGraphPage: React.FC<AttackGraphPageProps> = ({ investigationId }) => {
  return (
    <div className="space-y-6">
      <AttackGraphView investigationId={investigationId} />
    </div>
  );
};
