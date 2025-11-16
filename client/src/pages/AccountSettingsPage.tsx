import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Save, Clock, Shield, User } from "lucide-react";

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

  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (policy: string) => {
      const response = await apiRequest("PATCH", "/api/auth/retention-policy", {
        dataRetentionPolicy: policy,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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

  // Initialize selected policy when user data loads
  useEffect(() => {
    if (userData?.user) {
      setSelectedPolicy(userData.user.dataRetentionPolicy ?? "forever");
      setIsPolicyHydrated(true);
    }
  }, [userData]);

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
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <div className="text-base">{userData.user.email}</div>
          </div>
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

      {/* Data Retention Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention Policy
          </CardTitle>
          <CardDescription>
            Choose how long your consent documents are kept before automatic deletion
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
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                data-testid="button-delete-all"
                disabled={deleteAllDataMutation.isPending}
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
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your
                  consent documents, recordings, and contracts from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllDataMutation.mutate()}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
