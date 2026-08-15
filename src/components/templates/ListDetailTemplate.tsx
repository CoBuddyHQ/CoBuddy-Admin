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
  isDetailOpen
}: ListDetailTemplateProps) {
  return (
    <div className="flex flex-1 min-h-0">
      <div className={`flex-1 transition-all duration-300 ${isDetailOpen ? 'mr-6 pr-6 border-r' : ''}`}>
        <PageHeader title={title} description={description} action={headerAction} />
        
        {listControls && (
          <div className="flex items-center gap-4 mb-4 bg-background p-3 rounded-md border">
            {listControls}
          </div>
        )}
        
        <div className="bg-background rounded-md border flex-1 overflow-auto">
          {listContent}
        </div>
      </div>
      
      {isDetailOpen && (
        <div className="w-[450px] shrink-0 bg-background border rounded-md shadow-sm overflow-auto">
          {detailPanel}
        </div>
      )}
    </div>
  );
}
