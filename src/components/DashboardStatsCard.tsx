import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface DashboardStatsCardProps {
  title: string;
  value: string | number | ReactNode; // Allow ReactNode for Skeleton
  icon?: ReactNode; // Made icon optional as it was removed in a previous request
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
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default DashboardStatsCard;
