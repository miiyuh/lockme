
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, UserCircle, Image as ImageIcon, KeyRound, Trash2, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, storage } from '@/lib/firebase';
import { updateProfile, type User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import imageCompression from 'browser-image-compression';
import { Progress } from '@/components/ui/progress';

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty.").max(50, "Display name is too long."),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);


  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultEncryptionStrength, setDefaultEncryptionStrength] = useState("aes-256-gcm");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName || '' });
      if (user.photoURL && !profileImageFile) {
        setProfileImagePreview(user.photoURL);
      } else if (!profileImageFile && !user.photoURL) {
        setProfileImagePreview(null);
      }
    }
  }, [user, form, profileImageFile]);


  const handleDisplayNameUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, { displayName: data.displayName });
      setUser(auth.currentUser);
      toast({ title: "Profile Updated", description: "Your display name has been updated successfully." });
      form.reset({ displayName: data.displayName });
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfileImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Original image cannot exceed 5MB. Please choose a smaller file.", variant: "destructive" });
        setProfileImageFile(null);
        setProfileImagePreview(user?.photoURL || null);
        event.target.value = "";
        return;
      }

      setIsCompressing(true);
      toast({ title: "Compressing Image...", description: `Optimizing ${file.name}. Please wait.` });
      console.log(`SettingsPage: Original file selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7,
        alwaysKeepResolution: false,
      };

      try {
        const compressedFile = await imageCompression(file, options);
        console.log(`SettingsPage: Compressed file ready: ${compressedFile.name}, Size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        setProfileImageFile(compressedFile);
        setProfileImagePreview(URL.createObjectURL(compressedFile));
        toast({ title: "Image Ready for Upload", description: `Compressed to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB. Click 'Upload Image'.`});
      } catch (error) {
        console.error('SettingsPage: Error compressing image:', error);
        toast({ title: "Compression Failed", description: "Could not compress image. Please try a different image or try again.", variant: "destructive" });
        setProfileImageFile(null);
        setProfileImagePreview(user?.photoURL || null);
      } finally {
        setIsCompressing(false);
        event.target.value = "";
      }
    }
  };

  const handleProfileImageUpload = async () => {
    if (!user || !profileImageFile) {
      toast({ title: "Error", description: "No image selected or user not logged in.", variant: "destructive"});
      return;
    }
    setIsUploadingPicture(true);
    setUploadProgress(null); // Initialize to null to indicate "starting"

    const fileExtension = profileImageFile.name.split('.').pop() || 'jpg';
    const fileNameInStorage = `profile_${user.uid}_${Date.now()}.${fileExtension}`;
    const filePath = `profilePictures/${user.uid}/${fileNameInStorage}`;
    const storageRef = ref(storage, filePath);

    console.log(`SettingsPage: Starting upload to: ${filePath}. Compressed Size: ${(profileImageFile.size / 1024 / 1024).toFixed(2)} MB`);
    const uploadTask = uploadBytesResumable(storageRef, profileImageFile);

    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log(`SettingsPage: Upload is ${progress.toFixed(2)}% done. State: ${snapshot.state}. Transferred: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
        switch (snapshot.state) {
          case 'paused':
            console.log('SettingsPage: Upload is paused');
            toast({ title: "Upload Paused", description: "Your upload has been paused.", variant: "default" });
            break;
          case 'running':
            // console.log('SettingsPage: Upload is running'); // Can be noisy, enable if needed for detailed debugging
            break;
        }
      },
      (error) => {
        console.error("SettingsPage: Error uploading profile picture:", error);
        toast({ title: "Upload Failed", description: (error as Error).message, variant: "destructive" });
        setIsUploadingPicture(false);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('SettingsPage: File available at', downloadURL);

          await updateProfile(user, { photoURL: downloadURL });
          setUser(auth.currentUser);

          toast({ title: "Profile Picture Updated!", description: "Your new profile picture is now active." });
          setProfileImageFile(null); // Clear the staged file
        } catch (error) {
            console.error("SettingsPage: Error getting download URL or updating profile:", error);
            toast({ title: "Profile Update Failed", description: "Could not finalize profile picture update.", variant: "destructive" });
        } finally {
            setIsUploadingPicture(false);
            setUploadProgress(null);
        }
      }
    );
  };


  const handlePasswordChange = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Password change functionality will be implemented in a future update.",
    });
  };

  const handleClearLocalCache = () => {
    localStorage.removeItem('lockme-snippets');
    toast({ title: "Local Cache Cleared", description: "Locally stored snippets and any app preferences have been reset." });
  };

  const isProcessing = isCompressing || isUploadingPicture || isUpdatingProfile;

  if (authLoading) {
    return <div className="container mx-auto py-8 text-center">Loading settings...</div>;
  }

  if (!user) {
    return <div className="container mx-auto py-8 text-center">Please log in to manage settings.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Settings className="mr-3 h-7 w-7 text-primary" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Customize your LockMe experience and manage your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            <section className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground flex items-center">
                <UserCircle className="mr-2 h-6 w-6 text-primary" />
                Profile
              </h3>

              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                <Avatar className="h-24 w-24 sm:h-20 sm:w-20">
                  <AvatarImage src={profileImagePreview || undefined} alt={user.displayName || "User"} data-ai-hint="profile avatar" />
                  <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle className="h-10 w-10"/>}</AvatarFallback>
                </Avatar>
                <div className="flex-grow text-center sm:text-left">
                  <Label htmlFor="profile-picture-input" className={`font-medium text-sm text-primary hover:underline ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <ImageIcon className="inline mr-1 h-4 w-4" /> Change Profile Picture
                  </Label>
                  <Input id="profile-picture-input" type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleProfileImageFileChange} disabled={isProcessing} />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 5MB.
                  </p>
                  {isCompressing && <p className="text-xs text-primary mt-1 flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Compressing image...</p>}
                  {profileImageFile && !isCompressing && (
                    <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs" title={profileImageFile.name}>
                            Ready: {profileImageFile.name} ({(profileImageFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <Button onClick={handleProfileImageUpload} size="sm" disabled={isProcessing} className="w-full sm:w-auto">
                            {isUploadingPicture ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%` : 'Preparing...'}
                                </>
                            ) : (
                                <><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>
                            )}
                        </Button>
                    </div>
                  )}
                  {isUploadingPicture && (
                    <div className="mt-2">
                      <Progress value={uploadProgress !== null ? uploadProgress : 0} className="h-2 w-full" />
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {uploadProgress !== null ? `${Math.round(uploadProgress)}% uploaded` : 'Starting upload...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleDisplayNameUpdate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} disabled={isProcessing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isProcessing || !form.formState.isDirty}>
                    {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!isUpdatingProfile && <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Save Display Name
                  </Button>
                </form>
              </Form>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email Address</Label>
                <Input id="email" type="email" value={user.email || ''} disabled className="bg-muted/50" />
                <p className="text-sm text-muted-foreground">Your email for account recovery (not editable).</p>
              </div>

              <div>
                <Button variant="outline" onClick={handlePasswordChange} disabled={isProcessing}>
                  <KeyRound className="mr-2 h-4 w-4" />Change Password
                </Button>
                 <p className="text-sm text-muted-foreground mt-2">Secure your account by regularly updating your password.</p>
              </div>
            </section>

            <section className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">General Preferences</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for important events (simulated).</p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <Label htmlFor="default-strength" className="font-medium">Default Encryption Algorithm</Label>
                 <Select
                    value={defaultEncryptionStrength}
                    onValueChange={setDefaultEncryptionStrength}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="default-strength" disabled={isProcessing}>
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes-256-gcm">AES-256-GCM (Recommended)</SelectItem>
                      <SelectItem value="aes-128-gcm">AES-128-GCM</SelectItem>
                      <SelectItem value="chacha20-poly1305">ChaCha20-Poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                <p className="text-sm text-muted-foreground">Select the default encryption algorithm for new files (simulated).</p>
              </div>
            </section>

            <section className="space-y-4 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">Data Management</h3>
               <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <Button variant="destructive" onClick={handleClearLocalCache} disabled={isProcessing}>
                  <Trash2 className="mr-2 h-4 w-4" />Clear Local Cache
                </Button>
                 <p className="text-sm text-muted-foreground mt-2">Remove any temporary data stored by the application in your browser.</p>
              </div>
            </section>
          </CardContent>
          <CardFooter className="pt-6 text-center">
              <p className="text-xs text-muted-foreground">
                LockMe Version: 1.0.0 (Simulated)
              </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
