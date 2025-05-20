
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import { FileLock, FileUp, KeyRound, ListChecks, Sparkles, MessageSquareQuote, MessageCircleQuestion, Wand2, ShieldCheck, ShieldOff, LucideActivity, FileInput, FileOutput, Activity, FolderLock, ListTree, Brain } from 'lucide-react'; // Added Activity, FolderLock, ListTree, Brain
import { useEffect, useState, useCallback } from 'react';
import { getRecentActivities } from '@/lib/services/firestoreService';
import type { Activity as ActivityType } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { lastActivityTimestamp } = useActivity();
  const [displayedActivities, setDisplayedActivities] = useState<ActivityType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [filesEncrypted, setFilesEncrypted] = useState(0);
  const [filesDecrypted, setFilesDecrypted] = useState(0);
  const [passphrasesGenerated, setPassphrasesGenerated] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);

  useEffect(() => {
    const performFetch = async () => {
      if (authLoading) {
        console.log("DashboardPage: Auth is loading, skipping fetch.");
        setLoadingData(true); 
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
        return;
      }
      
      setLoadingData(true);
      const currentUserId = user?.uid;
      console.log("DashboardPage: performFetch called. Authenticated User ID:", currentUserId, "Last Activity Timestamp:", lastActivityTimestamp);

      if (!currentUserId) {
        console.warn("DashboardPage: User object present, but UID is missing. This shouldn't happen if user is authenticated.");
        setLoadingData(false);
        return;
      }

      try {
        console.log(`DashboardPage: Fetching all activities for stats for userId: ${currentUserId}`);
        const allUserActivities = await getRecentActivities(currentUserId, undefined, true); 
        console.log("DashboardPage: All user activities fetched for stats (first 5):", JSON.stringify(allUserActivities.slice(0,5).map(a => ({id: a.id, type: a.type, userId: a.userId, description: a.description }))));
        console.log(`DashboardPage: Total ${allUserActivities.length} activities fetched for stats for user ${currentUserId}`);

        let encryptedCount = 0;
        let decryptedCount = 0;
        let passphraseCount = 0;
        let enhancedPromptCount = 0;
        let snippetCreatedCount = 0;
        let snippetUpdatedCount = 0;
        let snippetDeletedCount = 0;

        allUserActivities.forEach(act => {
          if (act.type === 'encrypt') encryptedCount++;
          else if (act.type === 'decrypt') decryptedCount++;
          else if (act.type === 'generate_passphrase') passphraseCount++;
          else if (act.type === 'enhance_prompt') enhancedPromptCount++;
          else if (act.type === 'snippet_created') snippetCreatedCount++;
          else if (act.type === 'snippet_updated') snippetUpdatedCount++;
          else if (act.type === 'snippet_deleted') snippetDeletedCount++;
        });
        
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
        console.log("DashboardPage: Recent activities fetched for log (first 5):", JSON.stringify(recentUserActivitiesForLog.slice(0,5).map(a => ({id: a.id, type: a.type, userId: a.userId, description: a.description }))));
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
        console.log("DashboardPage: performFetch finished.");
      }
    };

    console.log("DashboardPage: useEffect triggered. User:", user ? user.uid : null, "AuthLoading:", authLoading, "lastActivityTimestamp:", lastActivityTimestamp);
    performFetch();
  }, [user, authLoading, lastActivityTimestamp]); 


  const getIconForActivity = (type: ActivityType['type']) => {
    switch (type) {
      case 'encrypt': return <FileLock className="h-4 w-4 text-primary mr-2" />;
      case 'decrypt': return <FileUp className="h-4 w-4 text-primary mr-2" />;
      case 'generate_passphrase': return <KeyRound className="h-4 w-4 text-primary mr-2" />;
      case 'enhance_prompt': return <Sparkles className="h-4 w-4 text-primary mr-2" />;
      case 'snippet_created':
      case 'snippet_updated':
      case 'snippet_deleted':
         return <ListChecks className="h-4 w-4 text-primary mr-2" />;
      default: return <LucideActivity className="h-4 w-4 text-muted-foreground mr-2" />;
    }
  };

  if (authLoading || (!user && !authLoading)) { 
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 rounded-lg" />
        {!user && !authLoading && (
            <div className="text-center mt-8">
                <p className="text-lg text-muted-foreground">Please <Link href="/login" className="text-primary hover:underline">log in</Link> to view your dashboard.</p>
            </div>
        )}
      </div>
    );
  }
  
  if (loadingData && user) { 
     return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {user ? `Overview of your LockMe activity, ${user.displayName || user.email}.` : "Log in to see your activity."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex-grow">
            <CardHeader>
              <ShieldCheck className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Encrypt File</CardTitle>
              <CardDescription>Secure your files with strong encryption.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Description removed */}
            </CardContent>
          </div>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/encrypt">Go to Encrypt</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex-grow">
            <CardHeader>
              <ShieldOff className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Decrypt File</CardTitle>
              <CardDescription>Access your previously encrypted files.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Description removed */}
            </CardContent>
          </div>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/decrypt">Go to Decrypt</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex-grow">
            <CardHeader>
              <Wand2 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI Security Toolkit</CardTitle>
              <CardDescription>Generate passphrases & enhance prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Description removed */}
            </CardContent>
          </div>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/toolkit">Open AI Toolkit</Link>
            </Button>
          </CardFooter>
        </Card>
         <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex-grow">
            <CardHeader>
              <ListChecks className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Code Snippet Manager</CardTitle>
              <CardDescription>Store and manage your code snippets.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Description removed */}
            </CardContent>
          </div>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/snippets">Manage Snippets</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <DashboardStatsCard
          title="Files Encrypted"
          value={filesEncrypted.toString()}
          icon={<FolderLock className="text-primary" />}
          description="Your secured files"
        />
        <DashboardStatsCard
          title="Files Decrypted"
          value={filesDecrypted.toString()}
          icon={<FileOutput className="text-primary" />}
          description="Your accessed files"
        />
        <DashboardStatsCard
          title="Passphrases Generated"
          value={passphrasesGenerated.toString()}
          icon={<Brain className="text-primary" />}
          description="Via AI Toolkit"
        />
        <DashboardStatsCard
          title="Total Operations"
          value={totalOperations.toString()}
          icon={<Activity className="text-primary" />}
          description="Your encrypt, decrypt, generate, enhance, and snippet operations"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Recent Activity</CardTitle>
            <CardDescription>A log of your last 10 operations.</CardDescription>
          </CardHeader>
          <CardContent>
            {displayedActivities.length > 0 ? (
              <ScrollArea className="h-72">
                <ul className="space-y-3">
                  {displayedActivities.map((activity) => (
                    <li key={activity.id} className="flex items-center text-sm text-muted-foreground border-b pb-2 last:border-b-0 last:pb-0">
                      {getIconForActivity(activity.type)}
                      <span className="flex-grow">
                        {activity.description}
                        {activity.fileName && <span className="text-xs italic text-foreground/70"> ({activity.fileName})</span>}
                         {activity.snippetName && <span className="text-xs italic text-foreground/70"> (Snippet: {activity.snippetName})</span>}
                      </span>
                      <span className="text-xs ml-auto whitespace-nowrap">
                        {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp.seconds * 1000 + activity.timestamp.nanoseconds / 1000000), { addSuffix: true }) : 'Just now'}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-center py-10">
                <ListTree className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">
                  {user ? "No recent activity to display." : "Log in to see your activity."}
                </p>
                {user && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Start encrypting files or generating passphrases to see your activity here!
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
                <p className="mt-4 text-xs text-muted-foreground">
                  Showing your last {displayedActivities.length} activities.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
