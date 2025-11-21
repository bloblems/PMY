import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Link as LinkIcon, FileText, CheckCircle2, Grid3x3, FileSignature, Share2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface UserData {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  profile?: {
    profilePictureUrl?: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
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
  const [activeTab, setActiveTab] = useState<'contracts' | 'recordings'>('contracts');

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

  // Fetch user's contracts
  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ['/api/contracts'],
    enabled: !!user && activeTab === 'contracts',
  });

  // Fetch user's recordings
  const { data: recordings = [] } = useQuery<any[]>({
    queryKey: ['/api/recordings'],
    enabled: !!user && activeTab === 'recordings',
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
            <div data-testid="stat-recordings">
              <div className="text-lg font-semibold">{stats?.totalRecordings || 0}</div>
              <div className="text-xs text-muted-foreground">recordings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="mb-2">
        <h1 className="text-base font-semibold" data-testid="text-profile-name">
          {userName || 'User'}
        </h1>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="secondary"
          onClick={() => setLocation('/settings/account')}
          data-testid="button-edit-profile"
        >
          Edit profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => setLocation('/share')}
          data-testid="button-share-profile"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* Tab Navigation */}
      <div className="flex items-center justify-around border-b border-card-border mb-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-success text-success'
              : 'border-transparent text-muted-foreground'
          }`}
          data-testid="tab-contracts"
        >
          <FileSignature className="h-5 w-5" />
          <span className="text-sm font-medium">Contracts</span>
        </button>
        <button
          onClick={() => setActiveTab('recordings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
            activeTab === 'recordings'
              ? 'border-success text-success'
              : 'border-transparent text-muted-foreground'
          }`}
          data-testid="tab-recordings"
        >
          <Grid3x3 className="h-5 w-5" />
          <span className="text-sm font-medium">Recordings</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-1">
        {activeTab === 'contracts' && contracts.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">No contracts yet</p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Start by creating your first consent contract
            </p>
          </div>
        )}

        {activeTab === 'recordings' && recordings.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 px-4">
            <Grid3x3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">No recordings yet</p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Document consent with audio recordings
            </p>
          </div>
        )}

        {activeTab === 'contracts' &&
          contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/files`}
              className="aspect-square bg-card border border-card-border hover-elevate active-elevate-2 relative overflow-hidden"
              data-testid={`card-contract-${contract.id}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <FileSignature className="h-8 w-8 text-muted-foreground" />
              </div>
              {contract.verifiedAt && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-xs text-white font-medium truncate">
                  {contract.method || 'Contract'}
                </p>
              </div>
            </Link>
          ))}

        {activeTab === 'recordings' &&
          recordings.map((recording) => (
            <Link
              key={recording.id}
              href={`/files`}
              className="aspect-square bg-card border border-card-border hover-elevate active-elevate-2 relative overflow-hidden"
              data-testid={`card-recording-${recording.id}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Grid3x3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-xs text-white font-medium truncate">
                  {recording.duration || 'Recording'}
                </p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
