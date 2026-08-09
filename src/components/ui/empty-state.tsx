import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = "Nothing here yet", 
  description = "There are no items to display at this time.", 
  icon = <InboxIcon className="h-10 w-10 text-muted-foreground mb-4" /> 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px] bg-background/50 border border-dashed rounded-lg m-4">
      {icon}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {description}
      </p>
    </div>
  );
}
