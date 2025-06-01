"use client";

/**
 * Dashboard Page Component
 * 
 * Provides an overview of user activity in the LockMe application, including:
 * - Quick access cards to main application features
 * - Statistics on user operations (encryption, decryption, passphrase generation)
 * - Recent activity log with timestamps
 * 
 * The component handles authenticated and unauthenticated states, as well as
 * loading states for both authentication and data fetching processes.
 */

// React and Hooks
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import DashboardStatsCard from '@/components/DashboardStatsCard';

// Icons
import { 
  FileLock, 
  FileUp, 
  KeyRound, 
  ListChecks, 
  Sparkles, 
  Brain, 
  ListTree, 
  Activity as LucideActivity, 
  FileInput, 
  FileOutput, 
  FolderLock 
} from 'lucide-react';

// Services and Utilities
import { getRecentActivities } from '@/lib/services/firestoreService';
import { formatDistanceToNow } from 'date-fns';

// Types
import type { Activity as ActivityType } from '@/types/firestore';

// Contexts
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';

/**
 * Diagnostic setting to limit the number of activities fetched for calculating stats
 * Set to undefined or a very large number to fetch all for production
 */
const DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS = 50; // Temporarily limit for performance diagnosis
// const DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS = undefined; // Use this for fetching all

/**
 * Dashboard Page Component
 * 
 * Main dashboard for the LockMe application showing user statistics and recent activity
 * 
 * @returns {JSX.Element} The rendered dashboard component
 */
export default function DashboardPage() {
  // Authentication and activity context
  const { user, loading: authLoading } = useAuth();
  const { lastActivityTimestamp } = useActivity(); 
  
  // State management
  const [displayedActivities, setDisplayedActivities] = useState<ActivityType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filesEncrypted, setFilesEncrypted] = useState(0);
  const [filesDecrypted, setFilesDecrypted] = useState(0);
  const [passphrasesGenerated, setPassphrasesGenerated] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);
  
  // Ref to prevent concurrent fetches
  const isFetchingDataRef = useRef(false);

  /**
   * Fetches and processes user activity data
   * - Retrieves all user activities for statistics calculation
   * - Updates state with counts of different activity types
   * - Sets the most recent activities for display in the activity log
   */
  useEffect(() => {
    const performFetch = async () => {
      console.log("DashboardPage: performFetch called at", new Date().toISOString());
      
      // Prevent concurrent fetches
      if (isFetchingDataRef.current) {
        console.log("DashboardPage: performFetch called while already fetching. Aborting.");
        return;
      }
      
      // Skip fetch if authentication is still loading
      if (authLoading) {
        console.log("DashboardPage: Auth is loading, skipping fetch.");
        setLoadingData(false);
        return;
      }

      // Reset dashboard if user is not logged in
      if (!user) {
        console.log("DashboardPage: No user logged in, resetting stats and activities.");
        setFilesEncrypted(0);
        setFilesDecrypted(0);
        setPassphrasesGenerated(0);
        setTotalOperations(0);
        setDisplayedActivities([]);
        setLoadingData(false);
        return;
      }
      
      // Set loading states
      isFetchingDataRef.current = true;
      setLoadingData(true);

      const currentUserId = user?.uid;
      console.log("DashboardPage: performFetch user check. Authenticated User ID:", currentUserId, "Last Activity Timestamp:", lastActivityTimestamp);

      if (!currentUserId) {
        console.warn("DashboardPage: User object present, but UID is missing. This shouldn't happen if user is authenticated.");
        setLoadingData(false);
        isFetchingDataRef.current = false;
        return;
      }

      try {
        // Fetch user activities
        const fetchStartTime = Date.now();
        console.log(`DashboardPage: Fetching all activities for stats for userId: ${currentUserId} (limit: ${DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS === undefined ? 'ALL' : DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS})`);
        const allUserActivities = await getRecentActivities(currentUserId, DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS, true);
        const fetchEndTime = Date.now();
        console.log(`DashboardPage: Fetched all ${allUserActivities.length} activities for stats for user ${currentUserId} (took ${fetchEndTime - fetchStartTime}ms)`);
        console.log("DashboardPage: All user activities fetched for stats (first 5):", 
          JSON.stringify(allUserActivities.slice(0, 5).map(a => ({ 
            id: a.id, 
            type: a.type, 
            userId: a.userId, 
            description: a.description 
          }))));

        // Calculate activity statistics
        let encryptedCount = 0;
        let decryptedCount = 0;
        let passphraseCount = 0;
        let enhancedPromptCount = 0;
        let snippetCreatedCount = 0;
        let snippetUpdatedCount = 0;
        let snippetDeletedCount = 0;

        const calcStartTime = Date.now();
        allUserActivities.forEach(act => {
          switch (act.type) {
            case 'encrypt': encryptedCount++; break;
            case 'decrypt': decryptedCount++; break;
            case 'generate_passphrase': passphraseCount++; break;
            case 'enhance_prompt': enhancedPromptCount++; break;
            case 'snippet_created': snippetCreatedCount++; break;
            case 'snippet_updated': snippetUpdatedCount++; break;
            case 'snippet_deleted': snippetDeletedCount++; break;
          }
        });
        const calcEndTime = Date.now();
        console.log(`DashboardPage: Statistics calculation took ${calcEndTime - calcStartTime}ms`);

        // Calculate total operations
        const newTotalOperations = encryptedCount +
            decryptedCount +
            passphraseCount +
            enhancedPromptCount +
            snippetCreatedCount +
            snippetUpdatedCount +
            snippetDeletedCount;

        console.log("DashboardPage: Calculated stats - Encrypted:", encryptedCount, 
          "Decrypted:", decryptedCount, 
          "Passphrases:", passphraseCount, 
          "Total Ops:", newTotalOperations);

        // Update state with calculated statistics
        setFilesEncrypted(encryptedCount);
        setFilesDecrypted(decryptedCount);
        setPassphrasesGenerated(passphraseCount);
        setTotalOperations(newTotalOperations);

        // Use the already fetched activities for the recent activity log
        console.log(`DashboardPage: Fetching recent 10 activities for log for userId: ${currentUserId}`);
        const recentUserActivitiesForLog = allUserActivities.slice(0, 10); 
        console.log("DashboardPage: Recent activities for log (from allUserActivities, first 5):", 
          JSON.stringify(recentUserActivitiesForLog.slice(0, 5).map(a => ({ 
            id: a.id, 
            type: a.type, 
            userId: a.userId, 
            description: a.description 
          }))));
          
        setDisplayedActivities(recentUserActivitiesForLog);
      } catch (error) {
        // Handle fetch errors
        console.error("DashboardPage: Failed to fetch dashboard data:", error);
        setFilesEncrypted(0);
        setFilesDecrypted(0);
        setPassphrasesGenerated(0);
        setTotalOperations(0);
        setDisplayedActivities([]);
      } finally {
        // Reset loading states
        setLoadingData(false);
        isFetchingDataRef.current = false;
        console.log("DashboardPage: performFetch finished at", new Date().toISOString());
      }
    };

    console.log("DashboardPage: useEffect triggered. User:", user ? user.uid : null, "AuthLoading:", authLoading, "lastActivityTimestamp:", lastActivityTimestamp);
    performFetch();
  }, [user, authLoading, lastActivityTimestamp]);

  /**
   * Returns the appropriate icon component for a given activity type
   * @param {ActivityType['type']} type - The activity type
   * @returns {JSX.Element} The corresponding icon component
   */
  const getIconForActivity = (type: ActivityType['type']) => {
    switch (type) {
      case 'encrypt': 
        return <FileLock className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'decrypt': 
        return <FileUp className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'generate_passphrase': 
        return <KeyRound className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'enhance_prompt': 
        return <Sparkles className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'snippet_created':
      case 'snippet_updated':
      case 'snippet_deleted':
         return <ListChecks className="h-4 w-4 text-primary mr-2 shrink-0" />;
      default: 
        return <LucideActivity className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />;
    }
  };

  // Loading state when authentication is in progress
  if (authLoading || (!user && !authLoading && loadingData)) { 
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 sm:h-48 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 sm:h-72 rounded-lg" />
      </div>
    );
  }
  
  // Unauthenticated state
  if (!user && !authLoading) { 
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="text-center mt-6 sm:mt-8">
            <h1 className="text-2xl font-semibold mb-4">Welcome to LockMe</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Please <Link href="/" className="text-primary hover:underline">log in or sign up</Link> to view your dashboard and use the app features.
            </p>
        </div>
      </div>
    );
  }

  // Data loading state
  if (loadingData && user) { 
     return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Loading your LockMe activity, {user.displayName || user.email}...
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 sm:h-48 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 sm:h-72 rounded-lg" />
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      {/* Dashboard Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {user ? `Overview of your LockMe activity, ${user.displayName || user.email}.` : "Log in to see your activity."}
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Encrypt File Card */}
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 sm:pb-4 flex-grow">
            <FolderLock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-base sm:text-lg">Encrypt File</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Secure your files.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full text-sm">
              <Link href="/encrypt">Go to Encrypt</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Decrypt File Card */}
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 sm:pb-4 flex-grow">
            <FileOutput className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-base sm:text-lg">Decrypt File</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Access your files.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full text-sm">
              <Link href="/decrypt">Go to Decrypt</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* AI Toolkit Card */}
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 sm:pb-4 flex-grow">
            <Sparkles className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-base sm:text-lg">AI Security Toolkit</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Passwords & prompts.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full text-sm">
              <Link href="/toolkit">Open AI Toolkit</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Snippet Manager Card */}
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 sm:pb-4 flex-grow">
            <ListChecks className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-base sm:text-lg">Code Snippet Manager</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Store & manage code.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full text-sm">
              <Link href="/snippets">Manage Snippets</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <DashboardStatsCard
          title="Files Encrypted"
          value={filesEncrypted.toString()}
          icon={<FileLock />}
          description="Your secured files"
        />
        <DashboardStatsCard
          title="Files Decrypted"
          value={filesDecrypted.toString()}
          icon={<FileUp />}
          description="Your accessed files"
        />
        <DashboardStatsCard
          title="Passphrases Generated"
          value={passphrasesGenerated.toString()}
          icon={<Brain />}
          description="Via AI Toolkit"
        />
        <DashboardStatsCard
          title="Total Operations"
          value={totalOperations.toString()}
          icon={<LucideActivity />}
          description="All your recorded operations"
        />
      </div>

      {/* Recent Activity Card */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Your Recent Activity</CardTitle>
            <CardDescription className="text-sm sm:text-base">A log of your last 10 operations.</CardDescription>
          </CardHeader>
          <CardContent>
            {displayedActivities.length > 0 ? (
              <ScrollArea className="h-64 sm:h-72">
                <ul className="space-y-2 sm:space-y-3">
                  {displayedActivities.map((activity) => (
                    <li key={activity.id} className="flex items-center text-xs sm:text-sm text-muted-foreground border-b pb-1.5 sm:pb-2 last:border-b-0 last:pb-0 gap-2">
                      {getIconForActivity(activity.type)}
                      <span className="flex-1 min-w-0 truncate">
                        {activity.description}
                      </span>
                      <span className="text-xs whitespace-nowrap flex-shrink-0">
                        {activity.timestamp ? 
                          formatDistanceToNow(
                            new Date(activity.timestamp.seconds * 1000 + activity.timestamp.nanoseconds / 1000000), 
                            { addSuffix: true }
                          ) : 'Just now'
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 sm:py-10">
                <ListTree className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg text-muted-foreground mb-2">
                  {user ? "No recent activity to display." : "Log in to see your activity."}
                </p>
                {user && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    Start using LockMe to see your activity here!
                  </p>
                )}
                {user && (
                  <Button asChild variant="default" size="sm">
                    <Link href="/encrypt">Encrypt a File</Link>
                  </Button>
                )}
              </div>
            )}
            {displayedActivities.length > 0 && (
              <p className="mt-3 sm:mt-4 text-xs text-muted-foreground">
                Showing your last {displayedActivities.length} activities.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
