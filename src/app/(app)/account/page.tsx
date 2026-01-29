'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, ExternalLink, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const usernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
});

const displayNameSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name must be less than 50 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters long'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

type UsernameFormValues = z.infer<typeof usernameSchema>;
type DisplayNameFormValues = z.infer<typeof displayNameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export default function AccountPage() {
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const { toast } = useToast();
  const { user, auth, firestore, storage } = useFirebase();
  const router = useRouter();

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: '',
    },
  });

  const displayNameForm = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  // Fetch current username and profile settings
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const username = data?.username || '';
        setCurrentUsername(username);
        usernameForm.setValue('username', username);
        setIsProfilePublic(data?.isProfilePublic !== false);
      }
    };
    fetchUserData();
  }, [user, firestore]);
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload an image file.',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Image must be less than 2MB.',
      });
      return;
    }

    setIsAvatarUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update user profile
      await updateProfile(user, { photoURL });

      // Also update in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        photoURL,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Avatar Updated',
        description: 'Your profile photo has been updated.',
      });

      // Force refresh to show new avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload avatar.',
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setIsAvatarUploading(true);
    try {
      // Update user profile to remove photo (empty string instead of null)
      await updateProfile(user, { photoURL: '' });

      // Also update in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        photoURL: '',
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Photo Removed',
        description: 'Your profile photo has been removed.',
      });

      // Force refresh to show initials
      window.location.reload();
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast({
        variant: 'destructive',
        title: 'Removal Failed',
        description: error.message || 'Failed to remove photo.',
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleProfileVisibilityToggle = async (isPublic: boolean) => {
    if (!user) return;

    try {
      await setDoc(doc(firestore, 'users', user.uid), {
        isProfilePublic: isPublic,
        updatedAt: new Date(),
      }, { merge: true });

      setIsProfilePublic(isPublic);

      toast({
        title: isPublic ? 'Profile is now public' : 'Profile is now private',
        description: isPublic 
          ? 'Anyone can view your profile and public cards' 
          : 'Your profile is hidden from public view',
      });

      // Reload to update navigation menu
      window.location.reload();
    } catch (error: any) {
      console.error('Profile visibility update error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile visibility.',
      });
    }
  };

  const getInitials = (displayName: string | null | undefined, email: string | null | undefined) => {
    if (displayName) {
      const names = displayName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };
  const onUsernameSubmit = async (data: UsernameFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your username.',
      });
      return;
    }

    setIsUsernameLoading(true);
    try {
      // Check if username is already taken (only if changing username)
      if (data.username !== currentUsername) {
        const usernameQuery = query(
          collection(firestore, 'users'),
          where('username', '==', data.username)
        );
        const querySnapshot = await getDocs(usernameQuery);
        
        if (!querySnapshot.empty) {
          toast({
            variant: 'destructive',
            title: 'Username Taken',
            description: 'This username is already in use. Please choose another.',
          });
          setIsUsernameLoading(false);
          return;
        }
      }

      // Update username in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        username: data.username,
        email: user.email,
        displayName: user.displayName,
        updatedAt: new Date(),
      }, { merge: true });

      setCurrentUsername(data.username);

      toast({
        title: 'Username Updated',
        description: `Your username is now @${data.username}`,
      });
    } catch (error: any) {
      console.error('Username update error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const onDisplayNameSubmit = async (data: DisplayNameFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your display name.',
      });
      return;
    }

    setIsDisplayNameLoading(true);
    try {
      await updateProfile(user, {
        displayName: data.displayName,
      });

      // Force a token refresh to update the user state
      await user.getIdToken(true);

      toast({
        title: 'Display Name Updated',
        description: 'Your display name has been successfully changed. Refresh the page to see the update.',
      });
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsDisplayNameLoading(false);
    }
  };

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const deleteForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
    },
  });

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user || !user.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to change your password.',
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, data.newPassword);

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed.',
      });

      passwordForm.reset();
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Current password is incorrect.';
      }
      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description: errorMessage,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const onDeleteAccount = async (data: DeleteAccountFormValues) => {
    if (!user || !user.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to delete your account.',
      });
      return;
    }

    setIsDeleteLoading(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, data.password);
      await reauthenticateWithCredential(user, credential);

      // Delete user
      await deleteUser(user);

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      router.push('/');
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Password is incorrect.';
      }
      toast({
        variant: 'destructive',
        title: 'Account Deletion Failed',
        description: errorMessage,
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You must be logged in to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');

  return (
    <div className="container max-w-4xl py-6 sm:py-12 space-y-6 sm:space-y-8 px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-2">Account Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            {isGoogleUser && !user.photoURL?.includes('firebase') 
              ? 'Using your Google profile photo. Upload a custom photo to replace it.' 
              : 'Upload a custom profile photo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.photoURL || undefined} alt="Profile photo" />
              <AvatarFallback className="text-2xl">
                {getInitials(user.displayName, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isAvatarUploading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isAvatarUploading}
                >
                  {isAvatarUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                {user.photoURL && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    disabled={isAvatarUploading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Username */}
      <Card>
        <CardHeader>
          <CardTitle>Username</CardTitle>
          <CardDescription>Your unique username for your public profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...usernameForm}>
            <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-4">
              <FormField
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="flex items-center border rounded-md px-3 bg-muted">
                          <span className="text-muted-foreground">@</span>
                        </div>
                        <Input
                          placeholder="username"
                          disabled={isUsernameLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {currentUsername ? (
                        <>
                          Your public profile: {typeof window !== 'undefined' ? window.location.origin : ''}/{currentUsername}{' '}
                          <Link href={`/${currentUsername}`} target="_blank" className="inline-flex items-center text-primary hover:underline">
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </>
                      ) : 'Choose a unique username for your public profile'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUsernameLoading}>
                {isUsernameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Username
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...displayNameForm}>
            <form onSubmit={displayNameForm.handleSubmit(onDisplayNameSubmit)} className="space-y-4">
              <FormField
                control={displayNameForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        disabled={isDisplayNameLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isDisplayNameLoading}>
                {isDisplayNameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Display Name
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control who can see your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                {isProfilePublic 
                  ? 'Your profile and public cards are visible to everyone' 
                  : 'Your profile is hidden from public view'}
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={isProfilePublic}
              onCheckedChange={handleProfileVisibilityToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Account Type</p>
            <p className="text-sm text-muted-foreground">
              {isGoogleUser ? 'Google Account' : 'Email/Password Account'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password - Only show for email/password users */}
      {!isGoogleUser && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isPasswordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isPasswordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isPasswordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Form {...deleteForm}>
                <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-4">
                  <FormField
                    control={deleteForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm your password to continue</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isDeleteLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => deleteForm.reset()}>Cancel</AlertDialogCancel>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isDeleteLoading}
                    >
                      {isDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete Account
                    </Button>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
