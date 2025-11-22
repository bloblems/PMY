import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift, Trophy, Sparkles, Crown, Zap, Star, Users } from "lucide-react";
import { useLocation } from "wouter";

interface UserData {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  profile?: {
    username?: string;
    referralCode?: string;
    referralCount?: number;
  };
}

const REWARD_LEVELS = [
  {
    level: 1,
    name: "Explorer",
    minReferrals: 0,
    icon: Sparkles,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    benefits: [
      "Access to basic consent documentation",
      "Digital signature support",
      "Community support"
    ]
  },
  {
    level: 2,
    name: "Advocate",
    minReferrals: 3,
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    benefits: [
      "All Explorer benefits",
      "Priority email support",
      "Early access to new features",
      "Custom profile badge"
    ]
  },
  {
    level: 3,
    name: "Champion",
    minReferrals: 10,
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    benefits: [
      "All Advocate benefits",
      "Premium verification credits (3/month)",
      "Advanced analytics dashboard",
      "Exclusive Champion badge"
    ]
  },
  {
    level: 4,
    name: "Legend",
    minReferrals: 25,
    icon: Crown,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
    benefits: [
      "All Champion benefits",
      "Unlimited premium verifications",
      "Dedicated account manager",
      "Lifetime Legend status"
    ]
  }
];

export default function RewardsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  const referralCount = userData?.profile?.referralCount || 0;

  // Determine current level and progress
  const currentLevelData = [...REWARD_LEVELS]
    .reverse()
    .find(level => referralCount >= level.minReferrals) || REWARD_LEVELS[0];
  
  const currentLevelIndex = REWARD_LEVELS.findIndex(l => l.level === currentLevelData.level);
  const nextLevel = REWARD_LEVELS[currentLevelIndex + 1];
  
  // Calculate progress to next level
  const progressToNext = nextLevel 
    ? ((referralCount - currentLevelData.minReferrals) / (nextLevel.minReferrals - currentLevelData.minReferrals)) * 100
    : 100;

  const referralsNeeded = nextLevel ? nextLevel.minReferrals - referralCount : 0;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view rewards</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Create an account to unlock exclusive benefits
        </p>
        <Button onClick={() => setLocation('/auth')} data-testid="button-sign-in">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation('/profile')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Rewards</h1>
        <div className="w-9" />
      </div>

      {/* Current Level Card */}
      <Card className={`p-6 mb-6 ${currentLevelData.bgColor} border-2 ${currentLevelData.borderColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <currentLevelData.icon className={`h-5 w-5 ${currentLevelData.color}`} />
              <h2 className={`text-xl font-bold ${currentLevelData.color}`}>
                {currentLevelData.name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Level {currentLevelData.level}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Current
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Referrals</span>
            <span className="font-semibold" data-testid="text-referral-count">
              {referralCount}
            </span>
          </div>

          {nextLevel && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Progress to {nextLevel.name}
                  </span>
                  <span className="font-medium">
                    {referralsNeeded} more
                  </span>
                </div>
                <Progress value={progressToNext} className="h-2" data-testid="progress-next-level" />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Share Button */}
      <div className="mb-6">
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => setLocation('/share')}
          data-testid="button-share-referral"
        >
          <Zap className="h-4 w-4 mr-2" />
          Share Referral Link
        </Button>
      </div>

      {/* All Levels */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All Levels
        </h3>

        {REWARD_LEVELS.map((level, index) => {
          const isUnlocked = referralCount >= level.minReferrals;
          const isCurrent = level.level === currentLevelData.level;
          const LevelIcon = level.icon;

          return (
            <Card
              key={level.level}
              className={`p-4 transition-all ${
                isUnlocked
                  ? `${level.bgColor} border ${level.borderColor}`
                  : 'bg-muted/30 border-muted'
              } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              data-testid={`card-level-${level.level}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    isUnlocked ? level.bgColor : 'bg-muted'
                  }`}
                >
                  <LevelIcon
                    className={`h-5 w-5 ${
                      isUnlocked ? level.color : 'text-muted-foreground'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`font-semibold ${
                        isUnlocked ? '' : 'text-muted-foreground'
                      }`}
                    >
                      {level.name}
                    </h4>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {!isUnlocked && (
                      <Badge variant="secondary" className="text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {isUnlocked
                      ? `Unlocked with ${level.minReferrals} referrals`
                      : `Unlock with ${level.minReferrals} referrals`}
                  </p>

                  <ul className="space-y-1.5">
                    {level.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className={`text-xs flex items-start gap-2 ${
                          isUnlocked ? '' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="text-success mt-0.5">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="mt-8 p-4 rounded-xl bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          Invite friends to PMY and unlock exclusive benefits as you progress through levels
        </p>
      </div>
    </div>
  );
}
