'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  getDoc,
  increment,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { GradedCard, CardComment } from '@/lib/types';

interface CardSocialProps {
  card: GradedCard;
  onUpdate?: () => void;
}

export function CardSocial({ card, onUpdate }: CardSocialProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(card.likeCount || 0);
  const [comments, setComments] = useState<CardComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (user && card.likes) {
      setIsLiked(card.likes.includes(user.uid));
    }
    loadComments();
  }, [user, card]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const commentsRef = collection(firestore, 'card_comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }) as CardComment)
        .filter(c => c.cardId === card.publicShareId);
      
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like cards.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const cardRef = doc(firestore, 'users', card.userId, 'graded_cards', card.id);
      const publicCardRef = doc(firestore, 'public_graded_cards', card.publicShareId);
      const isOwner = user.uid === card.userId;

      if (isLiked) {
        // Unlike
        const updates = [
          updateDoc(publicCardRef, {
            likes: arrayRemove(user.uid),
            likeCount: increment(-1),
          }),
        ];
        
        // Only update private card if we're the owner AND it exists
        if (isOwner) {
          try {
            const privateCardSnap = await getDoc(cardRef);
            if (privateCardSnap.exists()) {
              updates.push(
                updateDoc(cardRef, {
                  likes: arrayRemove(user.uid),
                  likeCount: increment(-1),
                })
              );
            }
          } catch (err) {
            // Ignore errors checking private card
          }
        }
        
        await Promise.all(updates);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        const updates = [
          updateDoc(publicCardRef, {
            likes: arrayUnion(user.uid),
            likeCount: increment(1),
          }),
        ];
        
        // Only update private card if we're the owner AND it exists
        if (isOwner) {
          try {
            const privateCardSnap = await getDoc(cardRef);
            if (privateCardSnap.exists()) {
              updates.push(
                updateDoc(cardRef, {
                  likes: arrayUnion(user.uid),
                  likeCount: increment(1),
                })
              );
            }
          } catch (err) {
            // Ignore errors checking private card
          }
        }
        
        await Promise.all(updates);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }

      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // Get user info
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();

      const commentsRef = collection(firestore, 'card_comments');
      await addDoc(commentsRef, {
        cardId: card.publicShareId,
        userId: user.uid,
        userName: user.displayName || userData?.username || 'Anonymous',
        userAvatar: user.photoURL || '',
        comment: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      const isOwner = user.uid === card.userId;

      // Update comment count
      const publicCardRef = doc(firestore, 'public_graded_cards', card.publicShareId);
      
      const updates = [
        updateDoc(publicCardRef, { commentCount: increment(1) }),
      ];

      // Only update private card if we're the owner AND it exists
      if (isOwner) {
        try {
          const cardRef = doc(firestore, 'users', card.userId, 'graded_cards', card.id);
          const privateCardSnap = await getDoc(cardRef);
          if (privateCardSnap.exists()) {
            updates.push(updateDoc(cardRef, { commentCount: increment(1) }));
          }
        } catch (err) {
          // Ignore errors checking private card
        }
      }
      
      await Promise.all(updates);

      toast({
        title: 'Comment posted',
      });

      setNewComment('');
      loadComments();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post comment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Social
        </CardTitle>
        <CardDescription>Likes and comments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Like Button */}
        <div className="flex items-center gap-2">
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
            className="gap-2"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </Button>
        </div>

        {/* Comments Section */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Comments ({comments.length})</h4>
          
          {/* Add Comment */}
          {user && (
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date((comment.createdAt as any)?.toDate ? (comment.createdAt as any).toDate() : comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
