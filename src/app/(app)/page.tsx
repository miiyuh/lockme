
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import { FileLock, FileUp, KeyRound, ListChecks, Sparkles, Brain, ListTree, LucideActivity, FileInput, FileOutput, Activity, FolderLock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { getRecentActivities, addActivity } from '@/lib/services/firestoreService';
import type { Activity as ActivityType } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';

// DIAGNOSTIC: Limit the number of activities fetched for calculating stats
// Set to undefined or a very large number to fetch all for production
const DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS = 50; // Temporarily limit for performance diagnosis
// const DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS = undefined; // Use this for fetching all


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { lastActivityTimestamp, triggerActivityRefresh } = useActivity();
  const [displayedActivities, setDisplayedActivities] = useState<ActivityType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const isFetchingDataRef = useRef(false);


  const [filesEncrypted, setFilesEncrypted] = useState(0);
  const [filesDecrypted, setFilesDecrypted] = useState(0);
  const [passphrasesGenerated, setPassphrasesGenerated] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);

  useEffect(() => {
    const performFetch = async () => {
      console.log("DashboardPage: performFetch called at", new Date().toISOString());
      if (isFetchingDataRef.current) {
        console.log("DashboardPage: performFetch called while already fetching. Aborting.");
        return;
      }
      isFetchingDataRef.current = true;
      setLoadingData(true);


      if (authLoading) {
        console.log("DashboardPage: Auth is loading, skipping fetch.");
        setLoadingData(false);
        isFetchingDataRef.current = false;
        return;
      }

      if (!user) {
        console.log("DashboardPage: No user logged in, resetting stats and activities.");
        setFilesEncrypted(0);
        setFilesDecrypted(0);
        setPassphrasesGenerated(0);
        setTotalOperations(0);
        setDisplayedActivities([]);
        setLoadingData(false);
        isFetchingDataRef.current = false;
        return;
      }
      
      const currentUserId = user?.uid;
      console.log("DashboardPage: performFetch user check. Authenticated User ID:", currentUserId, "Last Activity Timestamp:", lastActivityTimestamp);

      if (!currentUserId) {
        console.warn("DashboardPage: User object present, but UID is missing. This shouldn't happen if user is authenticated.");
        setLoadingData(false);
        isFetchingDataRef.current = false;
        return;
      }

      try {
        const fetchStartTime = Date.now();
        console.log(`DashboardPage: Fetching all activities for stats for userId: ${currentUserId} (limit: ${DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS === undefined ? 'ALL' : DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS})`);
        // Fetch all activities for accurate stats calculation (or limited set for diagnostics)
        const allUserActivities = await getRecentActivities(currentUserId, DIAGNOSTIC_ACTIVITY_LIMIT_FOR_STATS, true);
        const fetchEndTime = Date.now();
        console.log(`DashboardPage: Fetched all ${allUserActivities.length} activities for stats for user ${currentUserId} (took ${fetchEndTime - fetchStartTime}ms)`);
        console.log("DashboardPage: All user activities fetched for stats (first 5):", JSON.stringify(allUserActivities.slice(0, 5).map(a => ({ id: a.id, type: a.type, userId: a.userId, description: a.description }))));


        let encryptedCount = 0;
        let decryptedCount = 0;
        let passphraseCount = 0;
        let enhancedPromptCount = 0;
        let snippetCreatedCount = 0;
        let snippetUpdatedCount = 0;
        let snippetDeletedCount = 0;

        const calcStartTime = Date.now();
        allUserActivities.forEach(act => {
          if (act.type === 'encrypt') encryptedCount++;
          else if (act.type === 'decrypt') decryptedCount++;
          else if (act.type === 'generate_passphrase') passphraseCount++;
          else if (act.type === 'enhance_prompt') enhancedPromptCount++;
          else if (act.type === 'snippet_created') snippetCreatedCount++;
          else if (act.type === 'snippet_updated') snippetUpdatedCount++;
          else if (act.type === 'snippet_deleted') snippetDeletedCount++;
        });
        const calcEndTime = Date.now();
        console.log(`DashboardPage: Statistics calculation took ${calcEndTime - calcStartTime}ms`);

        const newTotalOperations = encryptedCount +
            decryptedCount +
            passphraseCount +
            enhancedPromptCount +
            snippetCreatedCount +
            snippetUpdatedCount +
            snippetDeletedCount;

        console.log("DashboardPage: Calculated stats - Encrypted:", encryptedCount, "Decrypted:", decryptedCount, "Passphrases:", passphraseCount, "Total Ops:", newTotalOperations);

        setFilesEncrypted(encryptedCount);
        setFilesDecrypted(decryptedCount);
        setPassphrasesGenerated(passphraseCount);
        setTotalOperations(newTotalOperations);

        console.log(`DashboardPage: Fetching recent 10 activities for log for userId: ${currentUserId}`);
        const recentUserActivitiesForLog = await getRecentActivities(currentUserId, 10, true);
        console.log("DashboardPage: Recent activities fetched for log (first 5):", JSON.stringify(recentUserActivitiesForLog.slice(0, 5).map(a => ({ id: a.id, type: a.type, userId: a.userId, description: a.description }))));
        setDisplayedActivities(recentUserActivitiesForLog);

      } catch (error) {
        console.error("DashboardPage: Failed to fetch dashboard data:", error);
        setFilesEncrypted(0);
        setFilesDecrypted(0);
        setPassphrasesGenerated(0);
        setTotalOperations(0);
        setDisplayedActivities([]);
      } finally {
        setLoadingData(false);
        isFetchingDataRef.current = false;
        console.log("DashboardPage: performFetch finished at", new Date().toISOString());
      }
    };

    console.log("DashboardPage: useEffect triggered. User:", user ? user.uid : null, "AuthLoading:", authLoading, "lastActivityTimestamp:", lastActivityTimestamp);
    performFetch();
  }, [user, authLoading, lastActivityTimestamp]);


  const getIconForActivity = (type: ActivityType['type']) => {
    switch (type) {
      case 'encrypt': return <FileLock className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'decrypt': return <FileUp className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'generate_passphrase': return <KeyRound className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'enhance_prompt': return <Sparkles className="h-4 w-4 text-primary mr-2 shrink-0" />;
      case 'snippet_created':
      case 'snippet_updated':
      case 'snippet_deleted':
         return <ListChecks className="h-4 w-4 text-primary mr-2 shrink-0" />;
      default: return <LucideActivity className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />;
    }
  };

  if (authLoading || (!user && !authLoading && loadingData)) { // Show skeleton if auth is loading OR if no user and initial data load is happening
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 sm:h-48 rounded-lg" />)}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8 sm:mb-12">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 sm:h-72 rounded-lg" />
      </div>
    );
  }
  
  if (!user && !authLoading) { // If auth is resolved and there's no user
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="text-center mt-6 sm:mt-8">
            <h1 className="text-2xl font-semibold mb-4">Welcome to LockMe</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Please <Link href="/" className="text-primary hover:underline">log in or sign up</Link> to view your dashboard and use the app features.</p>
        </div>
      </div>
    );
  }

  if (loadingData && user) { // Show skeleton if user is present but data is still loading
     return (
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Loading your LockMe activity, {user.displayName || user.email}...</p>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 sm:h-48 rounded-lg" />)}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8 sm:mb-12">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 sm:h-72 rounded-lg" />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {user ? `Overview of your LockMe activity, ${user.displayName || user.email}.` : "Log in to see your activity."}
        </p>
      </div>

      {/* Shortcut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2 sm:pb-4 flex-grow">
            <FolderLock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle className="text-base sm:text-lg">Encrypt File</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Secure your files.</CardDescription>
          </CardHeader>
          {/* CardContent is removed for more compact card */}
          <CardFooter>
            <Button asChild className="w-full text-sm">
              <Link href="/encrypt">Go to Encrypt</Link>
            </Button>
          </CardFooter>
        </Card>
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
          icon={<Activity />}
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
                    <li key={activity.id} className="flex items-center text-xs sm:text-sm text-muted-foreground border-b pb-1.5 sm:pb-2 last:border-b-0 last:pb-0">
                      {getIconForActivity(activity.type)}
                      <span className="flex-grow truncate mr-2">
                        {activity.description}
                        {activity.fileName && <span className="text-xs italic text-foreground/70 ml-1">({activity.fileName})</span>}
                         {activity.snippetName && <span className="text-xs italic text-foreground/70 ml-1">(Snippet: {activity.snippetName})</span>}
                      </span>
                      <span className="text-xs ml-auto whitespace-nowrap">
                        {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp.seconds * 1000 + activity.timestamp.nanoseconds / 1000000), { addSuffix: true }) : 'Just now'}
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
