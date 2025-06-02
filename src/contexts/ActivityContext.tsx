"use client";

/**
 * ActivityContext
 * 
 * A React context that tracks user activity timestamps throughout the application.
 * Used for features that require knowledge of when a user last interacted with the app,
 * such as auto-logout functionality or session management.
 * 
 * Features:
 * - Tracks timestamp of last user activity
 * - Provides a method to refresh the activity timestamp
 * - Makes activity data available throughout the component tree
 */

// Type imports
import type { ReactNode } from 'react';

// React imports
import { 
  createContext, 
  useContext, 
  useState, 
  useCallback 
} from 'react';

/**
 * Interface defining the shape of the ActivityContext
 */
interface ActivityContextType {
  /** Timestamp of the last recorded user activity (null if no activity recorded) */
  lastActivityTimestamp: number | null;
  
  /** Function to update the activity timestamp to the current time */
  triggerActivityRefresh: () => void;
}

// Create context with undefined default value
const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

/**
 * ActivityProvider Component
 * 
 * Provides activity tracking context to its child components.
 * Initializes with current timestamp and exposes methods to update it.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to activity context
 * @returns {JSX.Element} Provider component wrapping children
 */
export function ActivityProvider({ children }: { children: ReactNode }) {
  // Initialize timestamp state with current time
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number | null>(Date.now());

  /**
   * Updates the activity timestamp to the current time
   * Memoized to prevent unnecessary re-renders
   */
  const triggerActivityRefresh = useCallback(() => {
    console.log("ActivityContext: triggerActivityRefresh called. Old timestamp:", 
      lastActivityTimestamp, "New:", Date.now());
    setLastActivityTimestamp(Date.now());
  }, [lastActivityTimestamp]); // Dependency ensures proper memoization

  // Provide context values to children
  return (
    <ActivityContext.Provider value={{ lastActivityTimestamp, triggerActivityRefresh }}>
      {children}
    </ActivityContext.Provider>
  );
}

/**
 * Custom hook to access the ActivityContext
 * 
 * Provides a convenient way to access activity tracking functionality
 * from any component within the ActivityProvider tree.
 * 
 * @throws {Error} If used outside of an ActivityProvider
 * @returns {ActivityContextType} The activity context value
 */
export function useActivity() {
  const context = useContext(ActivityContext);
  
  // Ensure the hook is used within a provider
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  
  return context;
}
