import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MasterListEditorTemplateProps {
  title: string;
  description?: string;
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  onAddClick: () => void;
  activeTab?: string;
  onTabChange?: (val: string) => void;
  hideAddButton?: boolean;
}

export function MasterListEditorTemplate({
  title,
  description,
  tabs,
  onAddClick,
  activeTab,
  onTabChange,
  hideAddButton
}: MasterListEditorTemplateProps) {
  const activeTabData = tabs.find(t => t.id === activeTab);

  if (!activeTab || !activeTabData) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <PageHeader title={title} description={description} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
          {tabs.map(tab => (
            <Card 
              key={tab.id} 
              className="cursor-pointer hover:shadow-md transition-shadow group overflow-hidden border-border/50"
              onClick={() => onTabChange?.(tab.id)}
            >
              <CardHeader className="p-6 flex flex-row items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{tab.label}</CardTitle>
                  <CardDescription className="text-xs mt-1">Manage configuration</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => onTabChange?.('')} className="shrink-0 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeTabData.label}</h1>
            <p className="text-sm text-muted-foreground">Manage {activeTabData.label.toLowerCase()} entries</p>
          </div>
        </div>
        
        {!hideAddButton && (
          <Button onClick={onAddClick} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add New Entry
          </Button>
        )}
      </div>
      
      <div className="flex-1 bg-card rounded-xl border overflow-hidden shadow-sm flex flex-col min-h-0">
        {activeTabData.content}
      </div>
    </div>
  );
}
