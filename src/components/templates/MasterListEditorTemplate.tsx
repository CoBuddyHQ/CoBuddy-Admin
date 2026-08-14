import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title={title} 
        description={description} 
        action={
          !hideAddButton && (
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Entry
            </Button>
          )
        }
      />
      <Tabs value={activeTab || tabs[0]?.id} onValueChange={onTabChange} orientation="vertical" className="w-full flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        <TabsList className="w-full md:w-64 flex-col items-stretch justify-start overflow-y-auto max-h-[40vh] md:max-h-full shrink-0 border rounded-md p-1 bg-background h-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="justify-start text-left shrink-0">{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 bg-background rounded-md border overflow-hidden m-0 p-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
