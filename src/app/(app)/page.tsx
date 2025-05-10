
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardStatsCard from '@/components/DashboardStatsCard';
import { FileLock, FileUp, FileDown, KeyRound, Activity, Users } from 'lucide-react';

export default function DashboardPage() {
  // Placeholder data - in a real app, this would come from a backend or state management
  const stats = {
    filesEncrypted: 125,
    filesDecrypted: 78,
    passphrasesGenerated: 340,
    averageFileSize: 2.5, // MB
    activeUsers: 1, // Placeholder
    totalOperations: 125 + 78 + 340,
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
          value={stats.filesEncrypted.toString()}
          icon={<FileLock className="h-5 w-5 text-primary" />}
          description="Total files secured"
        />
        <DashboardStatsCard
          title="Files Decrypted"
          value={stats.filesDecrypted.toString()}
          icon={<FileUp className="h-5 w-5 text-primary" />}
          description="Total files accessed"
        />
        <DashboardStatsCard
          title="Passphrases Generated"
          value={stats.passphrasesGenerated.toString()}
          icon={<KeyRound className="h-5 w-5 text-primary" />}
          description="Using AI Toolkit"
        />
        <DashboardStatsCard
          title="Total Operations"
          value={stats.totalOperations.toString()}
          icon={<Activity className="h-5 w-5 text-primary" />}
          description="Encrypt, Decrypt, Generate"
        />
         <DashboardStatsCard
          title="Avg. File Size"
          value={`${stats.averageFileSize} MB`}
          icon={<FileDown className="h-5 w-5 text-primary" />}
          description="Average size of processed files"
        />
        <DashboardStatsCard
          title="Active Users"
          value={stats.activeUsers.toString()}
          icon={<Users className="h-5 w-5 text-primary" />}
          description="Currently using the app"
        />
      </div>

      {/* You can add charts or more detailed reports here */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent file operations (placeholder).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Encrypted 'project_alpha.docx' - 5 minutes ago</li>
              <li>Generated a new passphrase - 1 hour ago</li>
              <li>Decrypted 'backup_photos.zip' - 3 hours ago</li>
              <li>Encrypted 'financials_q3.xlsx' - Yesterday</li>
            </ul>
            <p className="mt-4 text-xs">Note: This is illustrative data.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
