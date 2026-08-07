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
}

export function MasterListEditorTemplate({
  title,
  description,
  tabs,
  onAddClick,
  activeTab,
  onTabChange
}: MasterListEditorTemplateProps) {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title={title} 
        description={description} 
        action={
          <Button onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Entry
          </Button>
        }
      />
      
      <Tabs value={activeTab || tabs[0]?.id} onValueChange={onTabChange} className="w-full flex-1 flex flex-col">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-4 bg-background rounded-md border overflow-hidden">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
