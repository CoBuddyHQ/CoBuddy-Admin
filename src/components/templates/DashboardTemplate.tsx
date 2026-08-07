import React from 'react';
import { PageHeader } from '../layout/PageHeader';

interface DashboardTemplateProps {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  kpiCards?: React.ReactNode;
  chartArea?: React.ReactNode;
  bottomTable?: React.ReactNode;
}

export function DashboardTemplate({
  title,
  description,
  headerAction,
  kpiCards,
  chartArea,
  bottomTable
}: DashboardTemplateProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} action={headerAction} />
      
      {kpiCards && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards}
        </div>
      )}
      
      {chartArea && (
        <div className="bg-background p-6 rounded-md border">
          {chartArea}
        </div>
      )}
      
      {bottomTable && (
        <div className="bg-background rounded-md border overflow-hidden">
          {bottomTable}
        </div>
      )}
    </div>
  );
}
