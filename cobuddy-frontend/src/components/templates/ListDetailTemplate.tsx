import React from 'react';
import { PageHeader } from '../layout/PageHeader';

interface ListDetailTemplateProps {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  listControls?: React.ReactNode;
  listContent: React.ReactNode;
  detailPanel?: React.ReactNode;
  isDetailOpen: boolean;
}

export function ListDetailTemplate({
  title,
  description,
  headerAction,
  listControls,
  listContent,
  detailPanel,
  isDetailOpen,
}: ListDetailTemplateProps) {
  return (
    <div className="flex flex-1 min-h-0 min-w-0 w-full gap-6">
      <div className={`min-w-0 flex-1 ${isDetailOpen ? 'hidden xl:block' : ''}`}>
        <PageHeader title={title} description={description} action={headerAction} />

        {listControls && (
          <div className="flex flex-wrap items-center gap-4 mb-4">{listControls}</div>
        )}

        <div className="min-w-0 flex-1 overflow-auto">{listContent}</div>
      </div>

      {isDetailOpen && (
        <div className="w-full xl:w-[450px] min-w-0 shrink-0 bg-background xl:border-l overflow-auto">
          {detailPanel}
        </div>
      )}
    </div>
  );
}
