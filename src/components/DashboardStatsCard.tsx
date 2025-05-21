
import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardStatsCardProps {
  title: string;
  value: string | number | ReactNode;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

const DashboardStatsCard: FC<DashboardStatsCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
}) => {
  const isReactNodeValue = typeof value !== 'string' && typeof value !== 'number';
  const iconSizeClass = isReactNodeValue ? "h-20 w-20" : "h-24 w-24";

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {icon && (
        <div className="absolute bottom-2 right-0 -translate-x-1 z-0"> {/* Changed bottom-0 to bottom-2 and removed translate-y-1 */}
          {React.cloneElement(icon as React.ReactElement, { 
            className: cn(iconSizeClass, "text-primary opacity-10 pointer-events-none")
          })}
        </div>
      )}
      <div className="relative z-10"> {/* Content wrapper to ensure it's above the icon */}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{value}</div>
          {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
      </div>
    </Card>
  );
};

export default DashboardStatsCard;
