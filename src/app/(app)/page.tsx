
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import { FileLock, FileUp, KeyRound, ListChecks, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentActivities } from '@/lib/services/firestoreService';
import type { Activity as ActivityType } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // State for dashboard statistics
  const [filesEncrypted, setFilesEncrypted] = useState(0);
  const [filesDecrypted, setFilesDecrypted] = useState(0);
  const [passphrasesGenerated, setPassphrasesGenerated] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);

  // Placeholder data - some stats might remain placeholders if not derived from activities
  const placeholderStats = {
    averageFileSize: 2.5, // MB - This would require storing file sizes
    activeUsers: 1, // Placeholder
  };

  useEffect(() => {
    async function fetchActivities() {
      setLoadingActivities(true);
      try {
        const fetchedActivities = await getRecentActivities(10); // Fetch last 10 activities
        setActivities(fetchedActivities);

        // Calculate stats from fetched activities
        let encryptedCount = 0;
        let decryptedCount = 0;
        let passphraseCount = 0;
        let enhancedPromptCount = 0;

        fetchedActivities.forEach(act => {
          if (act.type === 'encrypt') encryptedCount++;
          if (act.type === 'decrypt') decryptedCount++;
          if (act.type === 'generate_passphrase') passphraseCount++;
          if (act.type === 'enhance_prompt') enhancedPromptCount++;
        });

        setFilesEncrypted(encryptedCount);
        setFilesDecrypted(decryptedCount);
        setPassphrasesGenerated(passphraseCount);
        setTotalOperations(encryptedCount + decryptedCount + passphraseCount + enhancedPromptCount);

      } catch (error) {
        console.error("Failed to fetch activities:", error);
        // Potentially set an error state here to inform the user
      } finally {
        setLoadingActivities(false);
      }
    }
    fetchActivities();
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
         return <ListChecks className="h-4 w-4 text-primary mr-2" />; // Placeholder, could be Code icon
      default: return <ListChecks className="h-4 w-4 text-muted-foreground mr-2" />;
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your LockMe activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatsCard
          title="Files Encrypted"
          value={loadingActivities ? <Skeleton className="h-6 w-12" /> : filesEncrypted.toString()}
          description="Total files secured"
        />
        <DashboardStatsCard
          title="Files Decrypted"
          value={loadingActivities ? <Skeleton className="h-6 w-12" /> : filesDecrypted.toString()}
          description="Total files accessed"
        />
        <DashboardStatsCard
          title="Passphrases Generated"
          value={loadingActivities ? <Skeleton className="h-6 w-12" /> : passphrasesGenerated.toString()}
          description="Using AI Toolkit"
        />
        <DashboardStatsCard
          title="Total Operations"
          value={loadingActivities ? <Skeleton className="h-6 w-12" /> : totalOperations.toString()}
          description="Encrypt, Decrypt, Generate, Enhance"
        />
         <DashboardStatsCard
          title="Avg. File Size"
          value={`${placeholderStats.averageFileSize} MB`}
          description="Average size of processed files (Demo)"
        />
        <DashboardStatsCard
          title="Active Users"
          value={placeholderStats.activeUsers.toString()}
          description="Currently using the app (Demo)"
        />
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent operations.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <ScrollArea className="h-72">
                <ul className="space-y-3">
                  {activities.map((activity) => (
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
             {!loadingActivities && activities.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Showing last {activities.length} activities.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

