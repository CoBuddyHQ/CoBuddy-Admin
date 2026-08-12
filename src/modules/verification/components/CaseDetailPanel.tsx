import { VerificationCase } from '../types';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { EvidenceViewer } from './EvidenceViewer';
import { DecisionActions } from './DecisionActions';
import { formatDate } from '@/lib/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '../constants';

interface Props {
  caseData: VerificationCase;
  onClose: () => void;
}

import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

export function CaseDetailPanel({ caseData, onClose }: Props) {
  const { kycDocumentTypes } = useMasterData();
  
  const getDocTypeLabel = (code: string) => {
    const r = kycDocumentTypes.find(x => x.code === code);
    return r ? getLocalizedText(r.label, 'en') : code;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-4 border-b shrink-0 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-lg">{caseData.id}</div>
        <Badge variant="outline" className="ml-auto">{STATUS_LABELS[caseData.status]}</Badge>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* User Info Card */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">{caseData.applicantName}</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Type: {caseData.applicantType}</p>
            <p>Doc Type: {getDocTypeLabel(caseData.documentType)}</p>
            <p>Submitted: {formatDate(caseData.submittedAt)}</p>
            {caseData.applicantType === 'COMPANION' && caseData.backgroundDeclarationUrl && (
              <p className="mt-2">
                <a href={caseData.backgroundDeclarationUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  View Background Declaration
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Evidence Viewer */}
        <EvidenceViewer 
          idUrl={caseData.idDocumentUrl}
          selfieUrl={caseData.selfieUrl}
          faceScore={caseData.faceMatchScore}
          liveness={caseData.livenessPass}
          docValid={caseData.documentValid}
        />

        {/* Actions (only if pending) */}
        {caseData.status === 'PENDING_MANUAL_REVIEW' && (
          <DecisionActions caseId={caseData.id} />
        )}

        {/* Audit Trail */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Audit Trail</h4>
          <div className="space-y-2">
            {caseData.auditTrail.map((log, i) => (
              <div key={i} className="text-sm bg-muted/20 p-3 rounded-md border">
                <div className="flex justify-between text-muted-foreground mb-1 text-xs">
                  <span>{log.actor}</span>
                  <span>{formatDate(log.timestamp)}</span>
                </div>
                <div className="font-medium">{log.action}</div>
                {log.notes && <div className="text-muted-foreground mt-1">{log.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
