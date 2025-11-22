import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Link as LinkIcon, Share2, Gift, Calendar, Shield, MapPin, Clock, Users, Award, UserCircle, BadgeCheck } from "lucide-react";
import { useLocation } from "wouter";

interface UserData {
  user: {
    id: string;
    email: string;
    name: string | null;
    referralCount?: number;
  };
  profile?: {
    username?: string;
    profilePictureUrl?: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
    createdAt?: string;
    dataRetentionPolicy?: string;
    defaultUniversityId?: string | null;
    stateOfResidence?: string | null;
    defaultEncounterType?: string | null;
    defaultContractDuration?: number | null;
    referralCount?: number;
    referralCode?: string;
    isVerified?: string;
    verificationProvider?: string | null;
    verifiedAt?: string | null;
    verificationLevel?: string | null;
  };
}

interface ConsentStats {
  totalContracts: number;
  activeContracts: number;
  totalRecordings: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user profile
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  // Fetch consent stats
  const { data: stats } = useQuery<ConsentStats>({
    queryKey: ['/api/profile/stats'],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your profile</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Create an account to start documenting consent
        </p>
        <Button onClick={() => setLocation('/auth')} data-testid="button-sign-in">
          Sign In
        </Button>
      </div>
    );
  }

  const userName = user.user_metadata?.name as string | undefined;
  const initials = userName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="max-w-md mx-auto pb-6">
      {/* Profile Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <Avatar className="h-20 w-20 border-2 border-card-border" data-testid="avatar-profile">
          <AvatarImage src={userData?.profile?.profilePictureUrl || undefined} alt={userName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex items-center justify-around text-center mb-4">
            <div data-testid="stat-contracts">
              <div className="text-lg font-semibold">{stats?.totalContracts || 0}</div>
              <div className="text-xs text-muted-foreground">contracts</div>
            </div>
            <div data-testid="stat-active">
              <div className="text-lg font-semibold text-success">{stats?.activeContracts || 0}</div>
              <div className="text-xs text-muted-foreground">active</div>
            </div>
            <div data-testid="stat-referrals">
              <div className="text-lg font-semibold">{userData?.user?.referralCount || 0}</div>
              <div className="text-xs text-muted-foreground">referrals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Username & Name */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5">
          <h1 className="text-base font-semibold" data-testid="text-profile-username">
            @{userData?.profile?.username || 'username'}
          </h1>
          {userData?.profile?.isVerified === 'true' && (
            <BadgeCheck 
              className="h-4 w-4 text-primary fill-primary/20" 
              data-testid="icon-verified-badge"
              aria-label="Verified account"
            />
          )}
        </div>
        {userName && (
          <p className="text-sm text-muted-foreground" data-testid="text-profile-name">
            {userName}
          </p>
        )}
      </div>

      {/* Bio */}
      {userData?.profile?.bio && (
        <p className="text-sm mb-3" data-testid="text-bio">
          {userData.profile.bio}
        </p>
      )}

      {/* Website Link */}
      {userData?.profile?.websiteUrl && (
        <a
          href={userData.profile.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover-elevate mb-4"
          data-testid="link-website"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <span className="truncate">{userData.profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
        </a>
      )}

      {/* Get Verified CTA for non-verified users */}
      {userData?.profile?.isVerified !== 'true' && (
        <Card className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Get Verified</h3>
                <p className="text-xs text-muted-foreground">
                  Unlock premium features and gain trust
                </p>
              </div>
            </div>
            <Button
              onClick={() => setLocation('/verification')}
              size="sm"
              className="w-full"
              data-testid="button-get-verified"
            >
              <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
              Verify Account - $5
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Button
          variant="secondary"
          onClick={() => setLocation('/settings/account')}
          data-testid="button-edit-profile"
          className="text-xs"
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          onClick={() => setLocation('/share')}
          data-testid="button-share-profile"
          className="text-xs"
        >
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Share
        </Button>
        <Button
          variant="secondary"
          onClick={() => setLocation('/rewards')}
          data-testid="button-rewards"
          className="text-xs"
        >
          <Gift className="h-3.5 w-3.5 mr-1.5" />
          Rewards
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* Profile Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Profile Details
        </h3>

        {/* Account Information - Merged Card */}
        <Card className="overflow-hidden hover-elevate active-elevate-2" data-testid="card-account-info">
          <div className="relative">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
            <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-amber-500/20 dark:from-blue-500/30 dark:via-purple-500/25 dark:to-amber-500/30 p-4 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-blue-500/20 dark:bg-blue-400/30 backdrop-blur-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Member since</p>
                    <p className="text-sm font-semibold" data-testid="text-member-since">
                      {userData?.profile?.createdAt 
                        ? new Date(userData.profile.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })
                        : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-red-500/20 dark:bg-red-400/30 backdrop-blur-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Data retention</p>
                    <p className="text-sm font-semibold capitalize" data-testid="text-retention-policy">
                      {userData?.profile?.dataRetentionPolicy?.replace('days', ' days').replace('year', ' year') || 'Forever'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-amber-500/20 dark:bg-amber-400/30 backdrop-blur-sm">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Referrals</p>
                    <p className="text-sm font-semibold" data-testid="text-referrals">
                      {userData?.profile?.referralCount || 0} friends invited
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Default Preferences - Individual Cards */}
        {(userData?.profile?.stateOfResidence || 
          userData?.profile?.defaultEncounterType || 
          userData?.profile?.defaultContractDuration) && (
          <>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6">
              Default Preferences
            </h4>

            {userData?.profile?.stateOfResidence && (
              <Card className="overflow-hidden hover-elevate active-elevate-2" data-testid="card-state">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                  <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/20 dark:from-green-500/30 dark:via-emerald-500/25 dark:to-teal-500/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-2.5 rounded-lg bg-green-500/20 dark:bg-green-400/30 backdrop-blur-sm">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">State</p>
                        <p className="text-sm font-semibold" data-testid="text-state">
                          {userData.profile.stateOfResidence}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {userData?.profile?.defaultEncounterType && (
              <Card className="overflow-hidden hover-elevate active-elevate-2" data-testid="card-encounter">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
                  <div className="bg-gradient-to-br from-purple-500/20 via-violet-500/15 to-indigo-500/20 dark:from-purple-500/30 dark:via-violet-500/25 dark:to-indigo-500/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-2.5 rounded-lg bg-purple-500/20 dark:bg-purple-400/30 backdrop-blur-sm">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Encounter type</p>
                        <p className="text-sm font-semibold capitalize" data-testid="text-encounter-type">
                          {userData.profile.defaultEncounterType}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {userData?.profile?.defaultContractDuration && (
              <Card className="overflow-hidden hover-elevate active-elevate-2" data-testid="card-duration">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                  <div className="bg-gradient-to-br from-indigo-500/20 via-blue-500/15 to-cyan-500/20 dark:from-indigo-500/30 dark:via-blue-500/25 dark:to-cyan-500/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 p-2.5 rounded-lg bg-indigo-500/20 dark:bg-indigo-400/30 backdrop-blur-sm">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Default duration</p>
                        <p className="text-sm font-semibold" data-testid="text-duration">
                          {userData.profile.defaultContractDuration} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Quick Actions */}
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6 mb-3">
          Quick Actions
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          <Card
            className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
            onClick={() => setLocation('/settings/contacts')}
            data-testid="card-manage-contacts"
          >
            <div className="relative">
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <div className="bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-indigo-500/20 dark:from-cyan-500/30 dark:via-blue-500/25 dark:to-indigo-500/30 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-cyan-500/20 dark:bg-cyan-400/30 backdrop-blur-sm">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-0.5">My Contacts</h5>
                    <p className="text-xs text-muted-foreground">
                      Save frequently used contacts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
            onClick={() => setLocation('/settings/preferences')}
            data-testid="card-edit-preferences"
          >
            <div className="relative">
              <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
              <div className="bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-purple-500/20 dark:from-pink-500/30 dark:via-rose-500/25 dark:to-purple-500/30 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-pink-500/20 dark:bg-pink-400/30 backdrop-blur-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-0.5">Edit Preferences</h5>
                    <p className="text-xs text-muted-foreground">
                      Update default settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
            onClick={() => setLocation('/files')}
            data-testid="card-view-files"
          >
            <div className="relative">
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/20 dark:from-green-500/30 dark:via-emerald-500/25 dark:to-teal-500/30 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2.5 rounded-lg bg-green-500/20 dark:bg-green-400/30 backdrop-blur-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-0.5">Manage Contracts</h5>
                    <p className="text-xs text-muted-foreground">
                      Browse contracts & recordings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
