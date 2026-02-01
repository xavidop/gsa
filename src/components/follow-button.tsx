'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { notifyNewFollower } from '@/lib/notifications';
import { checkAchievementsInBackground } from '@/lib/gamification';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  onFollowChange?: () => void;
}

export function FollowButton({ targetUserId, targetUserName, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    checkFollowStatus();
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user || user.uid === targetUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const followsRef = collection(firestore, 'user_follows');
      const q = query(
        followsRef,
        where('followerId', '==', user.uid),
        where('followingId', '==', targetUserId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowId(snapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users.',
        variant: 'destructive',
      });
      return;
    }

    if (user.uid === targetUserId) return;

    setIsProcessing(true);
    try {
      if (isFollowing && followId) {
        // Unfollow
        await deleteDoc(doc(firestore, 'user_follows', followId));
        
        // Update follower counts
        await Promise.all([
          updateDoc(doc(firestore, 'users', targetUserId), {
            followerCount: increment(-1),
          }),
          updateDoc(doc(firestore, 'users', user.uid), {
            followingCount: increment(-1),
          }),
        ]);

        setIsFollowing(false);
        setFollowId(null);
        
        toast({
          title: 'Unfollowed',
          description: `You unfollowed ${targetUserName || 'this user'}.`,
        });
        
        // Notify parent component of change
        onFollowChange?.();
      } else {
        // Follow
        const followsRef = collection(firestore, 'user_follows');
        const docRef = await addDoc(followsRef, {
          followerId: user.uid,
          followingId: targetUserId,
          createdAt: serverTimestamp(),
        });

        // Update follower counts
        await Promise.all([
          updateDoc(doc(firestore, 'users', targetUserId), {
            followerCount: increment(1),
          }),
          updateDoc(doc(firestore, 'users', user.uid), {
            followingCount: increment(1),
          }),
        ]);

        setIsFollowing(true);
        setFollowId(docRef.id);
        
        // Get current user's username and send notification
        const currentUserDoc = await getDoc(doc(firestore, 'users', user.uid));
        const currentUsername = currentUserDoc.exists() 
          ? currentUserDoc.data().username || user.displayName || 'Someone'
          : 'Someone';
        
        await notifyNewFollower(firestore, targetUserId, currentUsername, user.uid);
        
        toast({
          title: 'Following',
          description: `You are now following ${targetUserName || 'this user'}.`,
        });
        
        // Check for achievements for the followed user (first_follower, influencer)
        checkAchievementsInBackground(targetUserId);
        
        // Notify parent component of change
        onFollowChange?.();
      }
      
      // Re-check follow status to ensure UI is in sync
      await checkFollowStatus();
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
        variant: 'destructive',
      });
      
      // Revert UI state on error
      await checkFollowStatus();
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show button if viewing own profile
  if (!user || user.uid === targetUserId) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleFollow}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
