import { CompanionApplication } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils/formatDate';
import { Check, X, Clock, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

interface Props {
  application: CompanionApplication;
  onAssignToMe: () => void;
  isAssigning: boolean;
  onSubmitDecision: (decision: 'APPROVE' | 'REJECT' | 'WAITLIST', notes: string, sectionRejectReasons?: Record<string, string>) => void;
  isSubmittingDecision: boolean;
}

export function ApplicationReviewView({ 
  application, 
  onAssignToMe, 
  isAssigning,
  onSubmitDecision,
  isSubmittingDecision
}: Props) {
  const [notes, setNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [sectionRejectReasons, setSectionRejectReasons] = useState<Record<string, string>>({});

  const { interests, languages, communicationStyles, activityPaces } = useMasterData();

  const getLabel = (code: string, list: any[]) => {
    const item = list.find(x => x.code === code);
    return item ? getLocalizedText(item.label, 'en') : code;
  };

  const handleSectionRejectChange = (section: string, value: string) => {
    setSectionRejectReasons(prev => ({ ...prev, [section]: value }));
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left Column: Details */}
      <div className="col-span-2 space-y-6 overflow-auto pb-8">
        <div className="bg-background rounded-md border p-6">
          <h2 className="text-xl font-bold mb-4">Applicant Profile</h2>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{application.email}<br/>{application.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City</p>
              <p className="font-medium">{application.city}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date of Birth (Gender)</p>
              <p className="font-medium">{formatDate(application.dateOfBirth).split(',')[0]} ({application.gender})</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Bio / About Me</p>
              <p className="font-medium mt-1 p-3 bg-muted rounded-md">{application.bio}</p>
            </div>
          </div>

          <h3 className="font-semibold mt-6 mb-3 text-lg border-t pt-4">Service Details</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Proposed Hourly Rate</p>
              <p className="font-medium">₹{application.proposedHourlyRate}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Work Preferences</p>
              <p className="font-medium">
                {getLabel(application.workPreferences?.communicationStyle || '', communicationStyles)} • {getLabel(application.workPreferences?.activityPace || '', activityPaces)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">Spoken Languages</p>
              <div className="flex flex-wrap gap-1">
                {application.spokenLanguages?.map(code => (
                  <Badge key={code} variant="secondary">{getLabel(code, languages)}</Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">Categories / Interests</p>
              <div className="flex flex-wrap gap-1">
                {application.categories?.map(code => (
                  <Badge key={code} variant="outline">{getLabel(code, interests)}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <h3 className="font-semibold mt-6 mb-3 text-lg border-t pt-4">Photos</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {application.photoUrls?.map((url, i) => (
              <img key={i} src={url} alt="Profile photo" className="h-32 w-32 object-cover rounded-md border bg-muted shrink-0" />
            ))}
            {(!application.photoUrls || application.photoUrls.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No photos provided.</p>
            )}
          </div>
        </div>
        
        <div className="bg-background rounded-md border p-6">
          <h2 className="text-xl font-bold mb-4">Trust & Verification</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-md border">
              <div>
                <p className="font-medium">Background Check</p>
                <p className="text-xs text-muted-foreground">Third-party criminal record check</p>
              </div>
              <Badge variant={application.backgroundCheckStatus === 'PASSED' ? 'default' : 'secondary'}>
                {application.backgroundCheckStatus}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-md border">
              <div>
                <p className="font-medium">Initial Trust Score</p>
                <p className="text-xs text-muted-foreground">Based on provided digital footprint</p>
              </div>
              <span className={`font-bold text-lg ${
                (application.trustScore || 0) >= 80 ? 'text-green-600' : 'text-orange-500'
              }`}>
                {application.trustScore || 'N/A'}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <div className="bg-background rounded-md border p-6 shadow-sm sticky top-0">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Current Status</p>
            <Badge variant="outline" className="text-sm">
              {application.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Assignment</p>
            {application.assignedTo ? (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{application.assignedTo}</span>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={onAssignToMe}
                disabled={isAssigning}
              >
                Assign To Me
              </Button>
            )}
          </div>

          {application.status === 'IN_REVIEW' && (
            <div className="space-y-4 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Final Decision</p>
              
              {!showRejectForm ? (
                <>
                  <Textarea 
                    placeholder="Interview notes / Decision rationale..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-24"
                  />
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => onSubmitDecision('APPROVE', notes)}
                      disabled={isSubmittingDecision}
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve Companion
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => onSubmitDecision('WAITLIST', notes)}
                      disabled={isSubmittingDecision}
                    >
                      <Clock className="w-4 h-4 mr-2" /> Add to Waitlist
                    </Button>
                    <Button 
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject Application...
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 bg-red-50 p-4 rounded-md border border-red-100">
                  <h4 className="font-semibold text-red-900 text-sm">Rejection Details</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">General Notes</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Overall rationale..." className="h-16" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Photos Issue</Label>
                      <Input value={sectionRejectReasons['photos'] || ''} onChange={e => handleSectionRejectChange('photos', e.target.value)} placeholder="e.g. Blurry, filtered" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pricing Issue</Label>
                      <Input value={sectionRejectReasons['pricing'] || ''} onChange={e => handleSectionRejectChange('pricing', e.target.value)} placeholder="e.g. Too high" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bio/Categories Issue</Label>
                      <Input value={sectionRejectReasons['categories'] || ''} onChange={e => handleSectionRejectChange('categories', e.target.value)} placeholder="e.g. Inappropriate bio" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)} className="w-1/3">Cancel</Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-2/3"
                      onClick={() => onSubmitDecision('REJECT', notes, Object.keys(sectionRejectReasons).length > 0 ? sectionRejectReasons : undefined)}
                      disabled={isSubmittingDecision}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
