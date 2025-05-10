
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  // In a real app, these would come from user preferences/state
  // const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // const [defaultEncryptionStrength, setDefaultEncryptionStrength] = useState("aes-256-gcm");

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Settings className="mr-2 h-6 w-6 text-primary" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Customize your LockMe experience. Changes are saved automatically (simulated).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">General</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for important events.</p>
                </div>
                <Switch id="notifications" defaultChecked={true} />
              </div>
              <div className="space-y-2 p-4 border rounded-lg">
                <Label htmlFor="default-strength" className="font-medium">Default Encryption Algorithm</Label>
                 <Select defaultValue="aes-256-gcm">
                    <SelectTrigger id="default-strength">
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes-256-gcm">AES-256-GCM (Recommended)</SelectItem>
                      <SelectItem value="aes-128-gcm">AES-128-GCM</SelectItem>
                      <SelectItem value="chacha20-poly1305">ChaCha20-Poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                <p className="text-sm text-muted-foreground">Select the default encryption algorithm for new files.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Account</h3>
               <div className="space-y-2 p-4 border rounded-lg">
                <Label htmlFor="email" className="font-medium">Email Address</Label>
                <Input id="email" type="email" defaultValue="user@example.com" disabled />
                <p className="text-sm text-muted-foreground">Your email for account recovery (not editable here).</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Button variant="outline">Change Password</Button>
                 <p className="text-sm text-muted-foreground mt-2">Secure your account by regularly updating your password.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Data Management</h3>
               <div className="p-4 border rounded-lg">
                <Button variant="destructive">Clear Local Cache</Button>
                 <p className="text-sm text-muted-foreground mt-2">Remove any temporary data stored by the application in your browser.</p>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                LockMe Version: 1.0.0 (Simulated)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
