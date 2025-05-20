
"use client";

import { useState, useEffect, type ChangeEvent, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, UserCircle, Image as ImageIcon, KeyRound, Trash2, Loader2, CheckCircle2, UploadCloud, Crop, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, storage } from '@/lib/firebase';
import { updateProfile, type User, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import imageCompression from 'browser-image-compression';
import { Progress } from '@/components/ui/progress';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop as CropperCropType, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty.").max(50, "Display name is too long."),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

async function canvasToFile(canvas: HTMLCanvasElement, fileName: string, fileType: string = 'image/png', quality: number = 0.95): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { console.error('Canvas to Blob conversion failed'); resolve(null); return; }
      resolve(new File([blob], fileName, { type: fileType, lastModified: Date.now() }));
    }, fileType, quality);
  });
}

async function canvasPreview(image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) {
  const ctx = canvas.getContext('2d');
  if (!ctx) { throw new Error('No 2d context'); }
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;
  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);
  ctx.restore();
}

const NOTIFICATIONS_KEY = 'lockme-notificationsEnabled';
const ENCRYPTION_STRENGTH_KEY = 'lockme-defaultEncryptionStrength';

export default function SettingsPage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null); 

  const [imgSrcToCrop, setImgSrcToCrop] = useState<string>('');
  const [crop, setCrop] = useState<CropperCropType | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
  const [showCropperModal, setShowCropperModal] = useState(false);
  const imageRefForCrop = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aspect = 1 / 1; 

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultEncryptionStrength, setDefaultEncryptionStrength] = useState("aes-256-gcm");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: user?.displayName || '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
      if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
      
      const savedStrength = localStorage.getItem(ENCRYPTION_STRENGTH_KEY);
      if (savedStrength) setDefaultEncryptionStrength(savedStrength);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsEnabled));
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENCRYPTION_STRENGTH_KEY, defaultEncryptionStrength);
    }
  }, [defaultEncryptionStrength]);

  useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName || '' });
      if (!profileImageFile) { setProfileImagePreview(user.photoURL || null); }
    }
  }, [user, user?.photoURL, profileImageFile, form]);

  const handleDisplayNameUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) { toast({ title: "Error", description: "You must be logged in.", variant: "destructive" }); return; }
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, { displayName: data.displayName });
      if (auth.currentUser) { await auth.currentUser.reload(); setUser(auth.currentUser); }
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
      form.reset({ displayName: data.displayName }); 
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive" });
    } finally { setIsUpdatingProfile(false); }
  };

  const handleOriginalFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(`SettingsPage: Original file selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      if (file.size > 15 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Original image cannot exceed 15MB.", variant: "destructive" });
        event.target.value = ""; return;
      }
      setCrop(undefined); 
      const reader = new FileReader();
      reader.addEventListener('load', () => { setImgSrcToCrop(reader.result?.toString() || ''); setShowCropperModal(true); });
      reader.readAsDataURL(file);
    }
    event.target.value = ""; 
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    imageRefForCrop.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    if (aspect) { setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)); }
  }

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imageRefForCrop.current || !previewCanvasRef.current) {
      toast({ title: "Crop Error", description: "Could not process crop. Please try again.", variant: "destructive" }); return;
    }
    setShowCropperModal(false);
    setIsCompressing(true);
    toast({ title: "Processing Cropped Image...", description: "Compressing your selection. Please wait." });
    await canvasPreview(imageRefForCrop.current, previewCanvasRef.current, completedCrop);
    const croppedFile = await canvasToFile(previewCanvasRef.current, 'croppedProfileImage.png', 'image/png');
    if (!croppedFile) {
      toast({ title: "Crop Error", description: "Failed to generate cropped file.", variant: "destructive" });
      setIsCompressing(false); return;
    }
    console.log(`SettingsPage: Cropped file created: ${croppedFile.name}, Size: ${(croppedFile.size / 1024 / 1024).toFixed(2)} MB`);
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true, initialQuality: 0.7, alwaysKeepResolution: false };
    try {
      console.log("SettingsPage: Compressing cropped image...");
      const compressedCroppedFile = await imageCompression(croppedFile, options);
      console.log(`SettingsPage: Compressed cropped file ready: ${compressedCroppedFile.name}, Size: ${(compressedCroppedFile.size / 1024 / 1024).toFixed(2)} MB`);
      setProfileImageFile(compressedCroppedFile);
      setProfileImagePreview(URL.createObjectURL(compressedCroppedFile));
      toast({ title: "Image Ready for Upload", description: `Cropped and compressed to ${(compressedCroppedFile.size / 1024 / 1024).toFixed(2)}MB. Click 'Upload Image'.`});
    } catch (error) {
      console.error('SettingsPage: Error compressing cropped image:', error);
      toast({ title: "Compression Failed", description: "Could not compress the cropped image.", variant: "destructive" });
      setProfileImageFile(null); setProfileImagePreview(user?.photoURL || null); 
    } finally { setIsCompressing(false); setImgSrcToCrop(''); }
  };

  const handleProfileImageUpload = async () => {
    if (!user || !profileImageFile) { toast({ title: "Error", description: "No image selected or user not logged in.", variant: "destructive"}); return; }
    setIsUploadingPicture(true); setUploadProgress(null); 
    const fileExtension = profileImageFile.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileNameInStorage = `profile_${user.uid}_${timestamp}.${fileExtension}`;
    const filePath = `profilePictures/${user.uid}/${fileNameInStorage}`;
    const storageRef = ref(storage, filePath);
    console.log(`SettingsPage: Starting upload to: ${filePath}. Compressed Size: ${(profileImageFile.size / 1024 / 1024).toFixed(2)} MB`);
    const uploadTask = uploadBytesResumable(storageRef, profileImageFile);
    uploadTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(progress);
      console.log(`SettingsPage: Upload is ${progress.toFixed(2)}% done. State: ${snapshot.state}. Transferred: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
    }, (error) => {
      console.error("SettingsPage: Error uploading profile picture:", error);
      toast({ title: "Upload Failed", description: (error as Error).message, variant: "destructive" });
      setIsUploadingPicture(false); setUploadProgress(null);
    }, async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('SettingsPage: File available at', downloadURL);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: downloadURL });
          await auth.currentUser.reload(); setUser(auth.currentUser);
        }
        toast({ title: "Profile Picture Updated!", description: "Your new profile picture is now active." });
        setProfileImageFile(null); 
      } catch (error) {
        console.error("SettingsPage: Error getting download URL or updating profile:", error);
        toast({ title: "Profile Update Failed", description: "Could not finalize profile picture update.", variant: "destructive" });
      } finally { setIsUploadingPicture(false); setUploadProgress(null); }
    });
  };

  const handlePasswordChange = async () => {
    if (!user || !user.email) { toast({ title: "Error", description: "You must be logged in and have a verified email.", variant: "destructive" }); return; }
    setIsUpdatingProfile(true); 
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Password Reset Email Sent", description: `An email has been sent to ${user.email} with instructions.` });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast({ title: "Failed to Send Email", description: (error as Error).message || "Could not send email.", variant: "destructive" });
    } finally { setIsUpdatingProfile(false); }
  };

  const handleClearLocalCache = () => {
    localStorage.removeItem(NOTIFICATIONS_KEY); 
    localStorage.removeItem(ENCRYPTION_STRENGTH_KEY);
    // Add any other app-specific localStorage keys here
    toast({ title: "Local Cache Cleared", description: "Locally stored app preferences have been reset." });
    // Optionally reset state variables to defaults
    setNotificationsEnabled(true);
    setDefaultEncryptionStrength("aes-256-gcm");
  };

  const isProcessing = isCompressing || isUploadingPicture || isUpdatingProfile;

  if (authLoading) { return <div className="container mx-auto py-8 text-center">Loading settings...</div>; }
  if (!user) { return <div className="container mx-auto py-8 text-center">Please log in to manage settings.</div>; }

  return (
    <div className="container mx-auto py-8">
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
      <Dialog open={showCropperModal} onOpenChange={(open) => { if (!open) { setShowCropperModal(false); setImgSrcToCrop(''); } else { setShowCropperModal(true); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crop Your Image</DialogTitle></DialogHeader>
          {imgSrcToCrop && (<ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} minHeight={100} minWidth={100}><img alt="Crop me" src={imgSrcToCrop} onLoad={onImageLoad} style={{ maxHeight: '70vh' }} /></ReactCrop>)}
          <DialogFooter><Button variant="outline" onClick={() => { setShowCropperModal(false); setImgSrcToCrop(''); }}>Cancel</Button><Button onClick={handleConfirmCrop} disabled={!completedCrop}>Confirm Crop</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader><CardTitle className="flex items-center text-2xl"><Settings className="mr-3 h-7 w-7 text-primary" />Application Settings</CardTitle><CardDescription>Customize your LockMe experience and manage your profile.</CardDescription></CardHeader>
          <CardContent className="space-y-10">
            <section className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><UserCircle className="mr-2 h-6 w-6 text-primary" />Profile</h3>
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                <Avatar className="h-24 w-24 sm:h-20 sm:w-20"><AvatarImage key={profileImagePreview} src={profileImagePreview || undefined} alt={user.displayName || "User"} data-ai-hint="profile avatar" /><AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle className="h-10 w-10"/>}</AvatarFallback></Avatar>
                <div className="flex-grow text-center sm:text-left">
                  <Label htmlFor="profile-picture-input-trigger" className={`font-medium text-sm text-primary hover:underline ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}><ImageIcon className="inline mr-1 h-4 w-4" /> Change Profile Picture</Label>
                  <Input id="profile-picture-input-trigger" type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleOriginalFileSelect} disabled={isProcessing} />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 15MB (original). Compression may take a moment for large images.</p>
                  {(isCompressing || (isUploadingPicture && uploadProgress === null)) && <p className="text-xs text-primary mt-1 flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {isCompressing ? 'Processing image...' : (uploadProgress === null ? 'Preparing upload...' : 'Starting upload...')}</p>}
                  {profileImageFile && !isCompressing && (<div className="mt-3 flex flex-col sm:flex-row items-center gap-2"><span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs" title={profileImageFile.name}>Ready: {profileImageFile.name} ({(profileImageFile.size / 1024 / 1024).toFixed(2)} MB)</span><Button onClick={handleProfileImageUpload} size="sm" disabled={isProcessing} className="w-full sm:w-auto">{isUploadingPicture ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%` : 'Preparing...'}</>) : (<><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>)}</Button></div>)}
                  {isUploadingPicture && uploadProgress !== null && (<div className="mt-2"><Progress value={uploadProgress} className="h-2 w-full" /><p className="text-xs text-muted-foreground text-center mt-1">{`${Math.round(uploadProgress)}% uploaded`}</p></div>)}
                   {isUploadingPicture && uploadProgress === null && (<p className="text-xs text-muted-foreground text-center mt-1">Starting upload...</p>)}
                </div>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleDisplayNameUpdate)} className="space-y-4">
                  <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} disabled={isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={isProcessing || !form.formState.isDirty}>{isUpdatingProfile && !isUploadingPicture && !isCompressing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{(!isUpdatingProfile || isUploadingPicture || isCompressing) && <CheckCircle2 className="mr-2 h-4 w-4" />}Save Display Name</Button>
                </form>
              </Form>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email Address</Label>
                <Input id="email" type="email" value={user.email || ''} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Your email for account recovery. To change your email, please <Link href="/contact" className="text-primary hover:underline">contact support</Link>.</p>
              </div>
              <div><Button variant="outline" onClick={handlePasswordChange} disabled={isProcessing}><KeyRound className="mr-2 h-4 w-4" />Change Password</Button><p className="text-xs text-muted-foreground mt-2">Secure your account by regularly updating your password. An email will be sent to you.</p></div>
            </section>
            <section className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">General Preferences</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div><Label htmlFor="notifications" className="font-medium">Enable Notifications</Label><p className="text-xs text-muted-foreground">Receive alerts for important events (simulated).</p></div>
                <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} disabled={isProcessing} />
              </div>
              <div className="space-y-2 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <Label htmlFor="default-strength" className="font-medium">Default Encryption Algorithm</Label>
                 <Select value={defaultEncryptionStrength} onValueChange={setDefaultEncryptionStrength} disabled={isProcessing}>
                  <SelectTrigger id="default-strength" disabled={isProcessing}><SelectValue placeholder="Select algorithm" /></SelectTrigger>
                  <SelectContent><SelectItem value="aes-256-gcm">AES-256-GCM (Recommended)</SelectItem><SelectItem value="aes-128-gcm">AES-128-GCM</SelectItem><SelectItem value="chacha20-poly1305">ChaCha20-Poly1305</SelectItem></SelectContent>
                </Select><p className="text-xs text-muted-foreground">Select the default algorithm for new files.</p>
              </div>
            </section>
            <section className="space-y-4 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">Data Management</h3>
               <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isProcessing}><Trash2 className="mr-2 h-4 w-4" />Clear Local Preferences</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action will remove locally stored LockMe preferences (like notification settings and default encryption algorithm) from this browser. It will not delete your account or any cloud-stored data.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClearLocalCache}>Yes, clear preferences</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <p className="text-xs text-muted-foreground mt-2">Remove application preferences stored in your browser.</p>
              </div>
            </section>
          </CardContent>
          <CardFooter className="pt-6 text-center"><p className="text-xs text-muted-foreground">LockMe Version: 1.0.0 (Simulated)</p></CardFooter>
        </Card>
      </div>
    </div>
  );
}
