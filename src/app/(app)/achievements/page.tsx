'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { getUserAchievements, checkAchievements, ACHIEVEMENTS } from '@/lib/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Lock, RefreshCw } from 'lucide-react';
import type { UserAchievement, Achievement } from '@/lib/types';

export default function AchievementsPage() {
  const { user } = useUser();
  const [completed, setCompleted] = useState<(UserAchievement & { achievement: Achievement })[]>([]);
  const [inProgress, setInProgress] = useState<(UserAchievement & { achievement: Achievement })[]>([]);
  const [locked, setLocked] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const handleCheckAchievements = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      await checkAchievements(user.uid);
      await loadAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    } finally {
      setChecking(false);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { completed: completedAchievements, inProgress: inProgressAchievements } = await getUserAchievements(user.uid);
      setCompleted(completedAchievements);
      setInProgress(inProgressAchievements);

      // Find locked achievements
      const achievedIds = new Set([
        ...completedAchievements.map(a => a.achievementId),
        ...inProgressAchievements.map(a => a.achievementId)
      ]);
      const lockedAchievements = ACHIEVEMENTS.filter(a => !achievedIds.has(a.id));
      setLocked(lockedAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-600 to-orange-500';
      case 'epic':
        return 'bg-gradient-to-r from-purple-600 to-pink-500';
      case 'rare':
        return 'bg-gradient-to-r from-blue-600 to-cyan-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRarityBadgeVariant = (rarity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (rarity) {
      case 'legendary':
        return 'default';
      case 'epic':
        return 'secondary';
      case 'rare':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const renderAchievementCard = (achievement: Achievement, userAchievement?: UserAchievement, isLocked = false) => {
    const progress = userAchievement ? (userAchievement.progress / achievement.requirement) * 100 : 0;
    const isCompleted = userAchievement?.completed || false;

    return (
      <Card key={achievement.id} className={`${isCompleted ? getRarityColor(achievement.rarity) : ''} ${isLocked ? 'opacity-50' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`text-4xl ${isLocked ? 'grayscale' : ''}`}>
              {isLocked ? <Lock className="h-10 w-10" /> : achievement.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-bold text-lg ${isCompleted ? 'text-white' : ''}`}>
                  {achievement.name}
                </h3>
                <Badge variant={getRarityBadgeVariant(achievement.rarity)} className={isCompleted ? 'bg-white/20 text-white' : ''}>
                  {achievement.rarity}
                </Badge>
              </div>
              <p className={`text-sm mb-3 ${isCompleted ? 'text-white/90' : 'text-muted-foreground'}`}>
                {achievement.description}
              </p>
              {!isLocked && userAchievement && !isCompleted && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {userAchievement.progress} / {achievement.requirement}
                  </div>
                </div>
              )}
              {isCompleted && userAchievement?.completedAt && (
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Award className="h-4 w-4" />
                  Unlocked {new Date(
                    userAchievement.completedAt instanceof Date 
                      ? userAchievement.completedAt 
                      : userAchievement.completedAt.toDate()
                  ).toLocaleDateString()}
                </div>
              )}
              {isLocked && (
                <div className="text-sm text-muted-foreground">
                  Hidden - Complete requirements to reveal
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">Loading achievements...</div>
      </div>
    );
  }

  const totalAchievements = ACHIEVEMENTS.length;
  const completedCount = completed.length;
  const completionRate = Math.round((completedCount / totalAchievements) * 100);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock rewards
          </p>
        </div>
        <Button 
          onClick={handleCheckAchievements} 
          disabled={checking}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check Progress'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">{completedCount} / {totalAchievements}</div>
              <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
            </div>
            <div className="text-4xl font-bold text-primary">{completionRate}%</div>
          </div>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="completed" className="w-full">
        <TabsList>
          <TabsTrigger value="completed">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            Locked ({locked.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="completed" className="space-y-4 mt-6">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No achievements unlocked yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start grading cards and building your collection!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completed.map(ua => renderAchievementCard(ua.achievement, ua))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress" className="space-y-4 mt-6">
          {inProgress.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No achievements in progress</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {inProgress.map(ua => renderAchievementCard(ua.achievement, ua))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="locked" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {locked.map(achievement => renderAchievementCard(achievement, undefined, true))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
