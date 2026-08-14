import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '@/components/ui/button';

interface ConfigFormSection {
  title: string;
  description?: string;
  children: React.ReactNode;
}

interface ConfigFormTemplateProps {
  title: string;
  description?: string;
  sections: ConfigFormSection[];
  onSave: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function ConfigFormTemplate({
  title,
  description,
  sections,
  onSave,
  onCancel,
  isSaving = false
}: ConfigFormTemplateProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={title} description={description} />
      
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="bg-background rounded-md border p-6">
            <h3 className="text-lg font-medium mb-1">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
            )}
            <div className="space-y-4">
              {section.children}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 bg-background p-4 rounded-md border">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <p className="text-sm text-muted-foreground w-full sm:w-auto sm:ml-auto">
          Note: changes take effect immediately, no app-redeploy needed
        </p>
      </div>
    </div>
  );
}
