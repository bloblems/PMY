import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2, Save, Clock, Shield, User, UserX, Eye, EyeOff, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface UserData {
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    dataRetentionPolicy?: string;
    createdAt: string;
    authMethod: string;
  };
  profile?: {
    profilePictureUrl?: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
  };
}

const retentionOptions = [
  {
    value: "30days",
    label: "30 Days",
    description: "Files older than 30 days will be automatically deleted",
  },
  {
    value: "90days",
    label: "90 Days",
    description: "Files older than 90 days will be automatically deleted",
  },
  {
    value: "1year",
    label: "1 Year",
    description: "Files older than 1 year will be automatically deleted",
  },
  {
    value: "forever",
    label: "Keep Forever",
    description: "Files will never be automatically deleted",
  },
];

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPolicy, setSelectedPolicy] = useState<string>("forever");
  const [isPolicyHydrated, setIsPolicyHydrated] = useState(false);
  
  // Profile editing state
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Change email state
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  
  // Delete account state
  const [isDeleteDataExpanded, setIsDeleteDataExpanded] = useState(false);
  const [isDeleteAccountExpanded, setIsDeleteAccountExpanded] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  
  const HOLD_DURATION = 3000; // 3 seconds
  const RETREAT_DURATION = 300; // 300ms for quick retreat

  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Initialize profile fields when user data loads
  useEffect(() => {
    if (userData?.profile) {
      setProfilePictureUrl(userData.profile.profilePictureUrl || "");
      setBio(userData.profile.bio || "");
      setWebsiteUrl(userData.profile.websiteUrl || "");
    }
  }, [userData]);

  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("picture", file);
      const response = await apiRequest("POST", "/api/profile/upload-picture", formData);
      return await response.json();
    },
    onSuccess: (data) => {
      setProfilePictureUrl(data.profilePictureUrl);
      toast({
        title: "Picture uploaded",
        description: "Your profile picture has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { profilePictureUrl?: string; bio?: string; websiteUrl?: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsProfileEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (policy: string) => {
      const response = await apiRequest("PATCH", "/api/auth/retention-policy", {
        dataRetentionPolicy: policy,
      });
      return await response.json();
    },
    onSuccess: (_, policy) => {
      // Update the cache directly instead of invalidating to prevent refetch issues
      queryClient.setQueryData(["/api/auth/me"], (old: UserData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          user: {
            ...old.user,
            dataRetentionPolicy: policy,
          },
        };
      });
      
      toast({
        title: "Settings saved",
        description: "Your data retention policy has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update retention policy",
        variant: "destructive",
      });
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("PATCH", "/api/auth/change-email", {
        newEmail: email,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], (old: UserData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          user: {
            ...old.user,
            email: newEmail,
          },
        };
      });
      
      setIsChangeEmailOpen(false);
      setNewEmail("");
      toast({
        title: "Email updated",
        description: "Your email address has been successfully changed",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message?.includes("already in use") 
        ? "This email is already in use" 
        : "Failed to update email address";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/delete-all-data", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Data deleted",
        description: "All your consent documents have been permanently deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete data",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/delete-account", {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      // Clear all cached data and navigate to home
      queryClient.clear();
      setTimeout(() => navigate("/"), 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  // Initialize selected policy when user data loads
  useEffect(() => {
    if (userData?.user) {
      setSelectedPolicy(userData.user.dataRetentionPolicy ?? "forever");
      setIsPolicyHydrated(true);
    }
  }, [userData]);

  // Handle file input change for profile picture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadPictureMutation.mutate(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      profilePictureUrl,
      bio,
      websiteUrl,
    });
  };

  // Hold button functions for delete account
  const startHold = () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    
    setIsHolding(true);
    holdStartRef.current = Date.now();

    holdTimerRef.current = window.setInterval(() => {
      if (holdStartRef.current) {
        const elapsed = Date.now() - holdStartRef.current;
        const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        setHoldProgress(progress);

        if (progress >= 100) {
          stopHold();
          deleteAccountMutation.mutate();
        }
      }
    }, 16); // ~60fps updates
  };

  const stopHold = () => {
    setIsHolding(false);
    holdStartRef.current = null;
    
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Quick retreat animation
    if (holdProgress < 100 && holdProgress > 0) {
      const startProgress = holdProgress;
      const retreatStart = Date.now();

      const retreatInterval = setInterval(() => {
        const elapsed = Date.now() - retreatStart;
        const retreatProgress = (elapsed / RETREAT_DURATION) * 100;
        const newProgress = startProgress - (startProgress * (retreatProgress / 100));
        
        if (newProgress <= 0 || retreatProgress >= 100) {
          setHoldProgress(0);
          clearInterval(retreatInterval);
        } else {
          setHoldProgress(newProgress);
        }
      }, 16);
    } else if (holdProgress >= 100) {
      setHoldProgress(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userData?.user) {
    navigate("/auth");
    return null;
  }

  const displayName = userData.user.name || 
    (userData.user.firstName && userData.user.lastName 
      ? `${userData.user.firstName} ${userData.user.lastName}` 
      : userData.user.firstName || userData.user.lastName || "User");

  const memberSince = new Date(userData.user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Obscure email with asterisks
  const obscureEmail = (email: string) => {
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    
    // Show first 2 characters and last character of local part
    const obscuredLocal = localPart.length > 3
      ? `${localPart.slice(0, 2)}${"*".repeat(Math.max(4, localPart.length - 3))}${localPart.slice(-1)}`
      : "*".repeat(localPart.length);
    
    return `${obscuredLocal}@${domain}`;
  };

  const userName = userData?.user.name || "";
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const hasProfileChanges = 
    profilePictureUrl !== (userData?.profile?.profilePictureUrl || "") ||
    bio !== (userData?.profile?.bio || "") ||
    websiteUrl !== (userData?.profile?.websiteUrl || "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and data retention policy
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Name</div>
            <div className="text-base">{displayName}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
            <div className="flex items-center gap-2">
              <div className="text-base flex-1 font-mono">
                {showEmail ? userData.user.email : obscureEmail(userData.user.email)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmail(!showEmail)}
                className="h-8 w-8"
                data-testid="button-toggle-email-visibility"
              >
                {showEmail ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangeEmailOpen(!isChangeEmailOpen)}
                data-testid="button-change-email"
              >
                Change
              </Button>
            </div>
          </div>

          {isChangeEmailOpen && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Change Email Address</p>
                <p className="text-xs font-semibold text-destructive">
                  This will permanently change how you sign in to your account.
                </p>
                <p className="text-xs text-muted-foreground">
                  After changing your email, you must use the new email address to sign in.
                  You will no longer be able to access this account using your current email address.
                </p>
                <p className="text-xs text-muted-foreground">
                  Make sure you have access to the new email address before proceeding.
                </p>
              </div>

              <div>
                <Label htmlFor="new-email" className="text-xs">
                  New Email Address
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  data-testid="input-new-email"
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    changeEmailMutation.mutate(newEmail);
                    setIsChangeEmailOpen(false);
                    setNewEmail("");
                  }}
                  disabled={!newEmail || changeEmailMutation.isPending}
                  data-testid="button-confirm-change-email"
                  className="flex-1"
                >
                  {changeEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Email"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangeEmailOpen(false);
                    setNewEmail("");
                  }}
                  data-testid="button-cancel-change-email"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground">Authentication Method</div>
            <div className="text-base capitalize">{userData.user.authMethod}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Member Since</div>
            <div className="text-base">{memberSince}</div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Customize your public profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profilePictureUrl} alt="Profile" />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-profile-picture"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPictureMutation.isPending}
                  data-testid="button-upload-picture"
                >
                  {uploadPictureMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Picture
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              data-testid="input-bio"
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                data-testid="input-website"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending || !hasProfileChanges}
            data-testid="button-save-profile"
            className="w-full"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Choose how long your consent documents are kept before automatic deletion. Warning: PMY does not keep copies of your contracts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedPolicy}
            onValueChange={setSelectedPolicy}
            className="space-y-3"
          >
            {retentionOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  data-testid={`radio-${option.value}`}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={() => updatePolicyMutation.mutate(selectedPolicy)}
            disabled={updatePolicyMutation.isPending || !isPolicyHydrated || selectedPolicy === userData.user.dataRetentionPolicy}
            data-testid="button-save-policy"
            className="w-full"
          >
            {updatePolicyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delete All Data */}
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full"
              data-testid="button-delete-all-data"
              disabled={deleteAllDataMutation.isPending}
              onClick={() => setIsDeleteDataExpanded(!isDeleteDataExpanded)}
            >
              {deleteAllDataMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All My Data
                </>
              )}
            </Button>

            {isDeleteDataExpanded && (
              <div className="rounded-lg border border-destructive bg-destructive/5 p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone. This will permanently delete all your
                    consent documents, recordings, and contracts from our servers.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deleteAllDataMutation.mutate();
                      setIsDeleteDataExpanded(false);
                    }}
                    data-testid="button-confirm-delete-data"
                    className="flex-1"
                  >
                    Delete Everything
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteDataExpanded(false)}
                    data-testid="button-cancel-delete-data"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              data-testid="button-delete-account"
              disabled={deleteAccountMutation.isPending}
              onClick={() => {
                const newState = !isDeleteAccountExpanded;
                setIsDeleteAccountExpanded(newState);
                if (!newState) {
                  setDeleteConfirmText("");
                  setHoldProgress(0);
                  if (holdTimerRef.current) {
                    clearInterval(holdTimerRef.current);
                  }
                }
              }}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>

            {isDeleteAccountExpanded && (
              <div className="rounded-lg border border-destructive bg-destructive/5 p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">
                    Delete Your Account
                  </p>
                  <p className="text-xs font-semibold text-destructive">
                    This action cannot be undone.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete your account and all associated data including
                    consent documents, recordings, and contracts from our servers.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="delete-confirm" className="text-xs">
                      Type "delete" to confirm
                    </Label>
                    <Input
                      id="delete-confirm"
                      type="text"
                      placeholder="Type delete"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      data-testid="input-delete-confirm"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Hold the button below for 3 seconds to confirm
                    </p>
                    <div
                      className="relative w-full h-12 border-2 border-destructive rounded-md cursor-pointer transition-transform overflow-hidden select-none"
                      onMouseDown={startHold}
                      onMouseUp={stopHold}
                      onMouseLeave={stopHold}
                      onTouchStart={startHold}
                      onTouchEnd={stopHold}
                      data-testid="button-hold-delete"
                    >
                      <div
                        className="absolute inset-0 bg-destructive/20 pointer-events-none"
                        style={{
                          width: `${holdProgress}%`,
                          transition: isHolding ? 'none' : `width ${RETREAT_DURATION}ms ease-out`,
                        }}
                      />
                      <div className="relative flex items-center justify-center h-full text-destructive font-semibold text-sm">
                        {deleteConfirmText.toLowerCase() !== "delete" ? (
                          "Type 'delete' first"
                        ) : holdProgress >= 100 ? (
                          "Deleting..."
                        ) : holdProgress > 0 ? (
                          "Hold..."
                        ) : (
                          "Hold to Delete Account"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDeleteAccountExpanded(false);
                    setDeleteConfirmText("");
                    setHoldProgress(0);
                    if (holdTimerRef.current) {
                      clearInterval(holdTimerRef.current);
                    }
                  }}
                  data-testid="button-cancel-delete-account"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
