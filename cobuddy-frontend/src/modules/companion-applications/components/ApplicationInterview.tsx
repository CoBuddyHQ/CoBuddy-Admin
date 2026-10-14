'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils/formatDate';
import { companionAppApi } from '../api';
import { CompanionApplication, ScheduleInterviewPayload } from '../types';

interface Props {
  application: CompanionApplication;
  canSchedule: boolean;
  isBusy: boolean;
  isScheduling: boolean;
  onSchedule: (payload: ScheduleInterviewPayload) => Promise<unknown>;
}

export function ApplicationInterview({
  application,
  canSchedule,
  isBusy,
  isScheduling,
  onSchedule,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewerStaffId, setInterviewerStaffId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const interviewers = useQuery({
    queryKey: ['companion-application-interviewers', application.id],
    queryFn: () => companionAppApi.getInterviewers(application.id),
    enabled: editing && canSchedule,
    retry: false,
  });

  const startEditing = () => {
    const interview = application.interview;
    const date = interview ? new Date(interview.scheduledAt) : null;
    setScheduledAt(
      date && Number.isFinite(date.getTime())
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
        : '',
    );
    setInterviewerStaffId(interview?.interviewerStaffId ?? '');
    setMeetingLink(interview?.meetingLink ?? '');
    setError('');
    setEditing(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      setError('Choose a future interview time.');
      return;
    }
    setError('');
    try {
      await onSchedule({
        scheduledAt: date.toISOString(),
        interviewerStaffId,
        ...(meetingLink.trim() ? { meetingLink: meetingLink.trim() } : {}),
      });
      setEditing(false);
    } catch {
      setError('Interview could not be saved. Your changes are kept; try again.');
    }
  };

  const interview = application.interview;
  return (
    <section
      className="bg-background rounded-md border p-6 space-y-4"
      aria-labelledby="interview-title"
    >
      <h2 id="interview-title" className="text-xl font-bold">
        Interview
      </h2>
      {interview ? (
        <dl className="space-y-2 text-sm break-words">
          <div>
            <dt className="text-muted-foreground">Scheduled time</dt>
            <dd>{formatDate(interview.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Interviewer</dt>
            <dd>{interview.interviewer?.name ?? 'Reviewer no longer available'}</dd>
          </div>
          {interview.meetingLink && /^https?:\/\//i.test(interview.meetingLink) && (
            <div>
              <dt className="text-muted-foreground">Meeting</dt>
              <dd>
                <a
                  className="underline"
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open meeting link
                </a>
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No interview details recorded.</p>
      )}
      {canSchedule && !editing && (
        <Button variant="outline" onClick={startEditing} disabled={isBusy}>
          {interview ? 'Reschedule Interview' : 'Schedule Interview'}
        </Button>
      )}
      {canSchedule && editing && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="interview-time">Interview time (your local time)</Label>
            <Input
              id="interview-time"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={isBusy}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="interview-reviewer">Interviewer</Label>
            <select
              id="interview-reviewer"
              required
              className="w-full min-w-0 rounded-md border bg-background p-2 text-sm"
              value={interviewerStaffId}
              onChange={(event) => setInterviewerStaffId(event.target.value)}
              disabled={isBusy || interviewers.isPending || interviewers.isError}
            >
              <option value="">Select an interviewer</option>
              {interviewers.data?.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
            {interviewers.isPending && <p className="text-sm">Loading reviewers...</p>}
            {interviewers.isError && (
              <div role="alert" className="text-sm">
                Could not load reviewers.{' '}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void interviewers.refetch()}
                >
                  Retry reviewers
                </Button>
              </div>
            )}
            {interviewers.isSuccess && !interviewers.data.length && (
              <p className="text-sm">No active reviewers are available for this city.</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="interview-link">Meeting link (optional)</Label>
            <Input
              id="interview-link"
              type="url"
              maxLength={2048}
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              disabled={isBusy}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={
                isBusy ||
                interviewers.isError ||
                !interviewers.data?.some((staff) => staff.id === interviewerStaffId)
              }
            >
              {isScheduling ? 'Saving interview...' : 'Save Interview'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
