
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import { FileLock, FileUp, KeyRound, ListChecks, Sparkles, MessageSquareQuote, MessageCircleQuestion, Wand2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentActivities } from '@/lib/services/firestoreService';
import type { Activity as ActivityType } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [displayedActivities, setDisplayedActivities] = useState<ActivityType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // State for dashboard statistics
  const [filesEncrypted, setFilesEncrypted] = useState(0);
  const [filesDecrypted, setFilesDecrypted] = useState(0);
  const [passphrasesGenerated, setPassphrasesGenerated] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoadingData(true);
      try {
        // Fetch all activities for statistics calculation
        // Pass no argument to getRecentActivities to fetch all activities
        const allActivitiesForStats = await getRecentActivities(); 

        let encryptedCount = 0;
        let decryptedCount = 0;
        let passphraseCount = 0;
        let enhancedPromptCount = 0;
        let snippetCreatedCount = 0;
        let snippetUpdatedCount = 0;
        let snippetDeletedCount = 0;

        allActivitiesForStats.forEach(act => {
          if (act.type === 'encrypt') encryptedCount++;
          else if (act.type === 'decrypt') decryptedCount++;
          else if (act.type === 'generate_passphrase') passphraseCount++;
          else if (act.type === 'enhance_prompt') enhancedPromptCount++;
          else if (act.type === 'snippet_created') snippetCreatedCount++;
          else if (act.type === 'snippet_updated') snippetUpdatedCount++;
          else if (act.type === 'snippet_deleted') snippetDeletedCount++;
        });

        setFilesEncrypted(encryptedCount);
        setFilesDecrypted(decryptedCount);
        setPassphrasesGenerated(passphraseCount);
        setTotalOperations(
            encryptedCount + 
            decryptedCount + 
            passphraseCount + 
            enhancedPromptCount +
            snippetCreatedCount +
            snippetUpdatedCount +
            snippetDeletedCount
        );

        // Fetch last 10 activities for the display log
        const recentActivitiesForLog = await getRecentActivities(10);
        setDisplayedActivities(recentActivitiesForLog);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Potentially set an error state here to inform the user
      } finally {
        setLoadingData(false);
      }
    }
    fetchDashboardData();
  }, []);


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
      default: return <ListChecks className="h-4 w-4 text-muted-foreground mr-2" />;
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your LockMe activity and quick actions.</p>
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
          value={loadingData ? <Skeleton className="h-6 w-12" /> : filesEncrypted.toString()}
          description="Total files secured"
        />
        <DashboardStatsCard
          title="Files Decrypted"
          value={loadingData ? <Skeleton className="h-6 w-12" /> : filesDecrypted.toString()}
          description="Total files accessed"
        />
        <DashboardStatsCard
          title="Passphrases Generated"
          value={loadingData ? <Skeleton className="h-6 w-12" /> : passphrasesGenerated.toString()}
          description="Using AI Toolkit"
        />
        <DashboardStatsCard
          title="Total Operations"
          value={loadingData ? <Skeleton className="h-6 w-12" /> : totalOperations.toString()}
          description="All encrypt, decrypt, generate, enhance, and snippet operations"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of your last 10 operations.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : displayedActivities.length > 0 ? (
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
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity to display. Start using LockMe!</p>
            )}
             {!loadingData && displayedActivities.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Showing last {displayedActivities.length} activities.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
