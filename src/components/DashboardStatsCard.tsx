
/**
 * DashboardStatsCard Component
 * 
 * A flexible card component designed for displaying statistics and key metrics
 * on dashboard interfaces with customizable icons, values, and descriptions.
 * 
 * Features:
 * - Supports text, numeric, or React node values
 * - Optional decorative icon with automatic sizing
 * - Optional descriptive text for context
 * - Consistent styling with customization options
 * - Automatically handles different value types
 */

import type { FC, ReactNode } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Props interface for the DashboardStatsCard component
 */
interface DashboardStatsCardProps {
  /** Title displayed at the top of the card */
  title: string;
  
  /** The main value to display (supports string, number, or React node) */
  value: string | number | ReactNode;
  
  /** Optional icon to display in the background */
  icon?: ReactNode;
  
  /** Optional description text displayed below the value */
  description?: string;
  
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Dashboard statistics card component
 * 
 * Renders a card designed to display a key metric or statistic with optional
 * icon and description. Handles different value types automatically.
 * 
 * @param props - Component props
 * @returns A styled card component for dashboard statistics
 */
const DashboardStatsCard: FC<DashboardStatsCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
}) => {
  // Determine if the value is a React node to adjust styling accordingly
  const isReactNodeValue = typeof value !== 'string' && typeof value !== 'number';
  
  // Adjust icon size based on value type
  const iconSizeClass = isReactNodeValue ? "h-20 w-20" : "h-24 w-24";

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Background Icon */}
      {icon && (
        <div className="absolute bottom-2 right-0 -translate-x-1 z-0">
          {React.cloneElement(icon as React.ReactElement, { 
            className: cn(iconSizeClass, "text-primary opacity-10 pointer-events-none")
          })}
        </div>
      )}
      
      {/* Card Content */}
      <div className="relative z-10">
        {/* Card Title */}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        
        {/* Card Value and Description */}
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {value}
          </div>
          
          {/* Optional Description */}
          {description && (
            <p className="text-xs text-muted-foreground pt-1">
              {description}
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default DashboardStatsCard;
