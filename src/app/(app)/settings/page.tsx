
"use client";

import { useState, useEffect, type ChangeEvent, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Firebase imports
import { updateProfile, type User, sendPasswordResetEmail, deleteUser, sendEmailVerification } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { auth, storage } from '@/lib/firebase';

// UI Component imports
import { 
  Settings, UserCircle, Image as ImageIcon, KeyRound, Trash2, 
  Loader2, CheckCircle2, UploadCloud, AlertTriangle, 
  MailWarning, ShieldAlert, MailCheck 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

// Image processing
import imageCompression from 'browser-image-compression';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop as CropperCropType, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


// Form validation schema
const profileFormSchema = z.object({
  displayName: z.string()
    .min(1, "Display name cannot be empty.")
    .max(50, "Display name is too long."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Local storage keys
const NOTIFICATIONS_KEY = 'lockme-notificationsEnabled';
const ENCRYPTION_STRENGTH_KEY = 'lockme-defaultEncryptionStrength';

/**
 * Converts a canvas to a File object
 * @param canvas - The canvas element to convert
 * @param fileName - The name to use for the resulting file
 * @param fileType - The MIME type of the file (default: image/png)
 * @param quality - The quality of the resulting image (0-1)
 * @returns A Promise that resolves to the File or null if conversion fails
 */
async function canvasToFile(
  canvas: HTMLCanvasElement, 
  fileName: string, 
  fileType: string = 'image/png', 
  quality: number = 0.95
): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { 
        console.error('Canvas to Blob conversion failed'); 
        resolve(null); 
        return; 
      }
      resolve(new File([blob], fileName, { 
        type: fileType, 
        lastModified: Date.now() 
      }));
    }, fileType, quality);
  });
}

/**
 * Renders a cropped preview of an image to a canvas
 * @param image - The source image element
 * @param canvas - The target canvas element
 * @param crop - The crop parameters
 */
async function canvasPreview(
  image: HTMLImageElement, 
  canvas: HTMLCanvasElement, 
  crop: PixelCrop
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) { throw new Error('No 2d context'); }
  
  // Calculate scaling factors
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Set canvas dimensions
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
  
  // Configure rendering context
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';
  
  // Calculate crop coordinates
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;
  
  // Draw the cropped image
  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image, 
    0, 0, 
    image.naturalWidth, image.naturalHeight, 
    0, 0, 
    image.naturalWidth, image.naturalHeight
  );
  ctx.restore();
}

/**
 * Settings page component allowing users to manage profile, security and preferences
 */
export default function SettingsPage() {
  // Auth and navigation hooks
  const { user, setUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: user?.displayName || '' },
    mode: 'onChange',
  });

  // Processing state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Profile image state
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null); 

  // Image cropping state
  const [imgSrcToCrop, setImgSrcToCrop] = useState<string>('');
  const [crop, setCrop] = useState<CropperCropType | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
  const [showCropperModal, setShowCropperModal] = useState(false);
  const imageRefForCrop = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aspect = 1 / 1; // Square aspect ratio for profile pictures

  // User preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultEncryptionStrength, setDefaultEncryptionStrength] = useState("aes-256-gcm");
  // Load saved preferences from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load notification preferences
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
      if (savedNotifications !== null) {
        setNotificationsEnabled(JSON.parse(savedNotifications));
      }
      
      // Load encryption strength preference
      const savedStrength = localStorage.getItem(ENCRYPTION_STRENGTH_KEY);
      if (savedStrength) {
        setDefaultEncryptionStrength(savedStrength);
      }
    }
  }, []);

  // Save notification preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsEnabled));
    }
  }, [notificationsEnabled]);

  // Save encryption strength preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENCRYPTION_STRENGTH_KEY, defaultEncryptionStrength);
    }
  }, [defaultEncryptionStrength]);

  // Update profile form and preview when user changes
  useEffect(() => {
    if (user) {
      // Update form with current display name
      profileForm.reset({ displayName: user.displayName || '' });
      
      // Only use user's photoURL if no image has been selected yet
      if (!profileImageFile) { 
        setProfileImagePreview(user.photoURL || null);
      }
    }
  }, [user, user?.photoURL, profileImageFile, profileForm]);
  /**
   * Updates the user's display name
   */
  const handleDisplayNameUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user || !auth.currentUser) { 
      toast({ 
        title: "Error", 
        description: "You must be logged in.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsUpdatingProfile(true);
    
    try {
      // Update profile in Firebase Auth
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      
      // Reload user data and update context
      await auth.currentUser.reload(); 
      setUser(auth.currentUser); 
      
      toast({ 
        title: "Profile Updated", 
        description: "Your display name has been updated." 
      });
      
      profileForm.reset({ displayName: data.displayName }); 
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({ 
        title: "Update Failed", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    } finally { 
      setIsUpdatingProfile(false); 
    }
  };

  /**
   * Handles the initial file selection for profile picture
   */
  const handleOriginalFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    
    if (file) {
      console.log(
        `SettingsPage: Original file selected: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
      
      // Check file size limit
      if (file.size > 15 * 1024 * 1024) { 
        toast({ 
          title: "File Too Large", 
          description: "Original image cannot exceed 15MB.", 
          variant: "destructive" 
        });
        
        if (fileInput) fileInput.value = ""; 
        return;
      }
      
      // Reset crop state
      setCrop(undefined); 
      
      // Read and display the image
      const reader = new FileReader();
      reader.addEventListener('load', () => { 
        setImgSrcToCrop(reader.result?.toString() || ''); 
        setShowCropperModal(true); 
      });
      
      reader.readAsDataURL(file);
    }
    
    // Clear the file input
    if (fileInput) fileInput.value = ""; 
  };

  /**
   * Initializes crop area when image loads in the cropper
   */
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    imageRefForCrop.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    
    if (aspect) { 
      // Create a centered crop with the specified aspect ratio
      setCrop(
        centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
          width, 
          height
        )
      ); 
    }
  }
  /**
   * Processes the cropped image when user confirms crop selection
   */
  const handleConfirmCrop = async () => {
    // Validate required references
    if (!completedCrop || !imageRefForCrop.current || !previewCanvasRef.current) {
      toast({ 
        title: "Crop Error", 
        description: "Could not process crop. Please try again.", 
        variant: "destructive" 
      });
      return;
    }

    // Close modal and show processing state
    setShowCropperModal(false);
    setIsCompressing(true);
    
    toast({ 
      title: "Processing Cropped Image...", 
      description: "Compressing your selection. Please wait." 
    });
    
    // Render the crop to canvas
    await canvasPreview(
      imageRefForCrop.current, 
      previewCanvasRef.current, 
      completedCrop
    );
    
    // Convert canvas to file
    const croppedFile = await canvasToFile(
      previewCanvasRef.current, 
      'croppedProfileImage.png', 
      'image/png'
    );
    
    if (!croppedFile) {
      toast({ 
        title: "Crop Error", 
        description: "Failed to generate cropped file.", 
        variant: "destructive" 
      });
      setIsCompressing(false);
      return;
    }
    
    console.log(
      `SettingsPage: Cropped file created: ${croppedFile.name}, Size: ${(croppedFile.size / 1024 / 1024).toFixed(2)} MB`
    );
    
    // Configure compression options
    const options = { 
      maxSizeMB: 0.5, 
      maxWidthOrHeight: 800, 
      useWebWorker: true, 
      initialQuality: 0.7, 
      alwaysKeepResolution: false 
    };
    
    try {
      console.log("SettingsPage: Compressing cropped image...");
      
      // Compress the image
      const compressedCroppedFile = await imageCompression(croppedFile, options);
      
      console.log(
        `SettingsPage: Compressed file ready: ${compressedCroppedFile.name}, Size: ${(compressedCroppedFile.size / 1024 / 1024).toFixed(2)} MB`
      );
      
      // Update state with compressed image
      setProfileImageFile(compressedCroppedFile);
      setProfileImagePreview(URL.createObjectURL(compressedCroppedFile));
      
      toast({ 
        title: "Image Ready for Upload", 
        description: `Cropped and compressed to ${(compressedCroppedFile.size / 1024 / 1024).toFixed(2)}MB. Click 'Upload Image'.`
      });
      
    } catch (error) {
      console.error('SettingsPage: Error compressing cropped image:', error);
      
      toast({ 
        title: "Compression Failed", 
        description: "Could not compress the cropped image.", 
        variant: "destructive" 
      });
      
      // Reset state
      setProfileImageFile(null);
      setProfileImagePreview(user?.photoURL || null); 
      
    } finally { 
      setIsCompressing(false);
      setImgSrcToCrop('');
    }
  };
  /**
   * Uploads the processed profile image to Firebase Storage
   */
  const handleProfileImageUpload = async () => {
    // Validate prerequisites
    if (!user || !auth.currentUser || !profileImageFile) { 
      toast({ 
        title: "Error", 
        description: "No image selected or user not logged in.", 
        variant: "destructive"
      }); 
      return; 
    }
    
    // Set loading state
    setIsUploadingPicture(true); 
    setUploadProgress(null); 
    
    // Create unique filename for storage
    const fileExtension = profileImageFile.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileNameInStorage = `profile_${user.uid}_${timestamp}.${fileExtension}`;
    const filePath = `profilePictures/${user.uid}/${fileNameInStorage}`;
    const storageRef = ref(storage, filePath);
    
    console.log(
      `SettingsPage: Starting upload to: ${filePath}. Compressed Size: ${(profileImageFile.size / 1024 / 1024).toFixed(2)} MB`
    );
    
    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, profileImageFile);
    
    // Monitor upload progress
    uploadTask.on('state_changed', 
      // Progress handler
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log(
          `SettingsPage: Upload is ${progress.toFixed(2)}% done. State: ${snapshot.state}. ` +
          `Transferred: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`
        );
      }, 
      
      // Error handler
      (error) => {
        console.error("SettingsPage: Error uploading profile picture:", error);
        toast({ 
          title: "Upload Failed", 
          description: (error as Error).message, 
          variant: "destructive" 
        });
        setIsUploadingPicture(false); 
        setUploadProgress(null);
      }, 
      
      // Completion handler
      async () => {
        try {
          // Get download URL for the uploaded file
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('SettingsPage: File available at', downloadURL);
          
          // Update user profile with new photo URL
          await updateProfile(auth.currentUser!, { photoURL: downloadURL });
          
          // Reload user data
          await auth.currentUser!.reload(); 
          setUser(auth.currentUser); 
          
          toast({ 
            title: "Profile Picture Updated!", 
            description: "Your new profile picture is now active." 
          });
          
          // Clean up
          setProfileImageFile(null); 
        } catch (error) {
          console.error("SettingsPage: Error getting download URL or updating profile:", error);
          toast({ 
            title: "Profile Update Failed", 
            description: "Could not finalize profile picture update.", 
            variant: "destructive" 
          });
        } finally { 
          setIsUploadingPicture(false); 
          setUploadProgress(null); 
        }
      }
    );
  };
  /**
   * Sends a password reset email to the user
   */
  const handlePasswordChange = async () => {
    if (!user || !user.email) { 
      toast({ 
        title: "Error", 
        description: "You must be logged in and have a verified email.", 
        variant: "destructive" 
      }); 
      return; 
    }
    
    setIsUpdatingProfile(true); 
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      
      toast({ 
        title: "Password Reset Email Sent", 
        description: `An email has been sent to ${user.email} with instructions.` 
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      toast({ 
        title: "Failed to Send Email", 
        description: (error as Error).message || "Could not send email.", 
        variant: "destructive" 
      });
    } finally { 
      setIsUpdatingProfile(false); 
    }
  };

  /**
   * Resends email verification
   */
  const handleResendVerificationEmail = async () => {
    if (!auth.currentUser) {
      toast({ 
        title: "Error", 
        description: "You must be logged in.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsResendingVerification(true);
    
    try {
      await sendEmailVerification(auth.currentUser);
      
      toast({ 
        title: "Verification Email Sent", 
        description: `A new verification email has been sent to ${auth.currentUser.email}. Please check your inbox.` 
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      
      toast({ 
        title: "Failed to Resend", 
        description: error.message || "Could not resend verification email.", 
        variant: "destructive" 
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  /**
   * Deletes the user account
   */
  const handleDeleteAccount = async () => {
    if (!auth.currentUser) { 
      toast({ 
        title: "Error", 
        description: "You must be logged in.", 
        variant: "destructive" 
      }); 
      return; 
    }
    
    setIsDeletingAccount(true);
    
    try {
      await deleteUser(auth.currentUser);
      
      toast({ 
        title: "Account Deleted", 
        description: "Your account has been permanently deleted. We're sad to see you go!" 
      });
      
      router.push('/login'); 
    } catch (error: any) {
      console.error("Error deleting account:", error);
      
      let description = "Could not delete account. Please try again.";
      
      if (error.code === 'auth/requires-recent-login') {
        description = "This operation is sensitive and requires recent authentication. " +
                      "Please log out and log back in before deleting your account.";
      } else {
        description = error.message || description;
      }
      
      toast({ 
        title: "Account Deletion Failed", 
        description, 
        variant: "destructive" 
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  /**
   * Clears local storage preferences
   */
  const handleClearLocalCache = () => {
    // Remove items from local storage
    localStorage.removeItem(NOTIFICATIONS_KEY); 
    localStorage.removeItem(ENCRYPTION_STRENGTH_KEY);
    
    // Reset state to defaults
    setNotificationsEnabled(true);
    setDefaultEncryptionStrength("aes-256-gcm");
    
    toast({ 
      title: "Local Cache Cleared", 
      description: "Locally stored app preferences have been reset." 
    });
  };

  // Combined processing state for UI feedback
  const isProcessing = isCompressing || 
                       isUploadingPicture || 
                       isUpdatingProfile || 
                       isDeletingAccount || 
                       isResendingVerification;
  // Loading state
  if (authLoading) { 
    return (
      <div className="container mx-auto py-8 text-center">
        Loading settings...
      </div>
    ); 
  }
  
  // Not logged in state
  if (!user) { 
    return (
      <div className="container mx-auto py-8 text-center">
        Please log in to manage settings.
      </div>
    ); 
  }

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
                  {(isCompressing || (isUploadingPicture && uploadProgress === null && profileImageFile)) && <p className="text-xs text-primary mt-1 flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {isCompressing ? 'Compressing image...' : (uploadProgress === null && profileImageFile ? 'Preparing upload...' : 'Starting upload...')}</p>}
                  {profileImageFile && !isCompressing && (<div className="mt-3 flex flex-col sm:flex-row items-center gap-2"><span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs" title={profileImageFile.name}>Ready: {profileImageFile.name} ({(profileImageFile.size / 1024 / 1024).toFixed(2)} MB)</span><Button onClick={handleProfileImageUpload} size="sm" disabled={isProcessing} className="w-full sm:w-auto">{isUploadingPicture ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%` : 'Preparing...'}</>) : (<><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>)}</Button></div>)}
                  {isUploadingPicture && uploadProgress !== null && (<div className="mt-2"><Progress value={uploadProgress} className="h-2 w-full" /><p className="text-xs text-muted-foreground text-center mt-1">{`${Math.round(uploadProgress)}% uploaded`}</p></div>)}
                  {isUploadingPicture && uploadProgress === null && !isCompressing && profileImageFile && (<p className="text-xs text-muted-foreground text-center mt-1">Starting upload...</p>)}
                </div>
              </div>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleDisplayNameUpdate)} className="space-y-4">
                  <FormField control={profileForm.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} disabled={isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={isProcessing || !profileForm.formState.isDirty || !profileForm.formState.isValid}>{isUpdatingProfile && !isUploadingPicture && !isCompressing && !isDeletingAccount && !isResendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{(!isUpdatingProfile || isUploadingPicture || isCompressing || isDeletingAccount || isResendingVerification) && <CheckCircle2 className="mr-2 h-4 w-4" />}Save Display Name</Button>
                </form>
              </Form>
            </section>

            <section className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-primary" />Account Management</h3>
              
              <div className="space-y-2">
                <Label className="font-medium">Current Email Address</Label>
                <Input type="email" value={user.email || ''} disabled className="bg-muted/50" />
                 <p className="text-xs text-muted-foreground mt-1">
                  Status: {user.emailVerified ? <span className="text-green-600 flex items-center"><MailCheck className="mr-1 h-4 w-4"/>Verified</span> : <span className="text-yellow-600 flex items-center"><MailWarning className="mr-1 h-4 w-4"/>Not Verified</span>}
                </p>
                {!user.emailVerified && (
                  <Button variant="outline" size="sm" onClick={handleResendVerificationEmail} disabled={isProcessing}>
                    {isResendingVerification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4"/>}
                    Resend Verification Email
                  </Button>
                )}
                 <p className="text-xs text-muted-foreground mt-1">
                    To change your email address, please <Link href="/contact" className="text-primary hover:underline">contact support</Link>.
                  </p>
              </div>
              
              <hr className="my-4"/>

              <div>
                <Button variant="outline" onClick={handlePasswordChange} disabled={isProcessing}>
                  <KeyRound className="mr-2 h-4 w-4" />Change Password
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Secure your account by regularly updating your password. An email will be sent to you with instructions.</p>
              </div>

              <hr className="my-4"/>
              
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isProcessing}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your LockMe account. 
                        All your authentication data will be removed. 
                        <strong className="text-destructive-foreground">Your associated data in Firestore (like code snippets and activity logs) and files in Firebase Storage (like profile pictures) will NOT be automatically deleted by this action.</strong> You would need to contact support or use other means to manage that data if desired.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                        {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground mt-2">Permanently remove your LockMe account and associated login credentials.</p>
              </div>
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
          <CardFooter className="pt-6 text-center"><p className="text-xs text-muted-foreground">LockMe v1.0.0</p></CardFooter>
        </Card>
      </div>
    </div>
  );
}
