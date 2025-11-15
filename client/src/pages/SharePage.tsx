import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Share2, Mail, Users, Trophy, QrCode, Copy, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

interface Referral {
  id: string;
  referrerId: string;
  refereeEmail: string;
  refereeId: string | null;
  status: string;
  invitationMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ConsentContract {
  id: string;
  encounterType: string;
  createdAt: string;
}

interface ConsentRecording {
  id: string;
  recordingType: string;
  createdAt: string;
}

export default function SharePage() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [shareDocumentEmail, setShareDocumentEmail] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<"contract" | "recording">("contract");

  // Fetch user's referral code
  const { data: referralData } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/user/referral-code"],
  });

  // Fetch referral stats
  const { data: stats } = useQuery<{ total: number; completed: number; pending: number }>({
    queryKey: ["/api/referrals/stats"],
  });

  // Fetch referral history
  const { data: referrals = [] } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  // Fetch user's consent contracts
  const { data: contracts = [] } = useQuery<ConsentContract[]>({
    queryKey: ["/api/contracts"],
  });

  // Fetch user's consent recordings
  const { data: recordings = [] } = useQuery<ConsentRecording[]>({
    queryKey: ["/api/recordings"],
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: async (data: { refereeEmail: string; invitationMessage: string }) => {
      return await apiRequest("POST", "/api/referrals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/stats"] });
      setInviteEmail("");
      setInviteMessage("");
      toast({
        title: "Invitation sent!",
        description: "Your friend has been invited to join PMY.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Share document mutation
  const shareDocumentMutation = useMutation({
    mutationFn: async (data: { documentId: string; documentType: string; recipientEmail: string }) => {
      return await apiRequest("POST", "/api/share-document", data);
    },
    onSuccess: () => {
      setShareDocumentEmail("");
      setSelectedDocumentId("");
      toast({
        title: "Document shared!",
        description: "The consent document has been sent via email.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    createReferralMutation.mutate({
      refereeEmail: inviteEmail,
      invitationMessage: inviteMessage || "Join me on PMY for secure Title IX consent documentation!",
    });
  };

  const handleShareDocument = () => {
    if (!shareDocumentEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedDocumentId) {
      toast({
        title: "Document required",
        description: "Please select a document to share.",
        variant: "destructive",
      });
      return;
    }
    shareDocumentMutation.mutate({
      documentId: selectedDocumentId,
      documentType: selectedDocumentType,
      recipientEmail: shareDocumentEmail,
    });
  };

  const handleCopyReferralLink = () => {
    if (referralData?.referralCode) {
      const referralLink = `${window.location.origin}/?ref=${referralData.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  const handleCopyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard.",
      });
    }
  };

  const referralLink = referralData?.referralCode 
    ? `${window.location.origin}/?ref=${referralData.referralCode}`
    : "";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[448px] mx-auto p-4 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Share & Invite</h1>
          <p className="text-sm text-muted-foreground">
            Share documents and invite friends to PMY
          </p>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" data-testid="tab-documents">
              <Share2 className="h-4 w-4 mr-1" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="invite" data-testid="tab-invite">
              <Mail className="h-4 w-4 mr-1" />
              Invite
            </TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">
              <Trophy className="h-4 w-4 mr-1" />
              Referrals
            </TabsTrigger>
          </TabsList>

          {/* Document Sharing Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Share Document via Email</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select
                    value={selectedDocumentType}
                    onValueChange={(value: "contract" | "recording") => {
                      setSelectedDocumentType(value);
                      setSelectedDocumentId("");
                    }}
                  >
                    <SelectTrigger id="document-type" data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Signature Contracts</SelectItem>
                      <SelectItem value="recording">Audio/Video Recordings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="select-document">Select Document</Label>
                  <Select
                    value={selectedDocumentId}
                    onValueChange={setSelectedDocumentId}
                  >
                    <SelectTrigger id="select-document" data-testid="select-document">
                      <SelectValue placeholder="Choose a document..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDocumentType === "contract" ? (
                        contracts.length === 0 ? (
                          <SelectItem value="none" disabled>No contracts available</SelectItem>
                        ) : (
                          contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.encounterType} - {format(new Date(contract.createdAt), "MMM d, yyyy")}
                            </SelectItem>
                          ))
                        )
                      ) : (
                        recordings.length === 0 ? (
                          <SelectItem value="none" disabled>No recordings available</SelectItem>
                        ) : (
                          recordings.map((recording) => (
                            <SelectItem key={recording.id} value={recording.id}>
                              {recording.recordingType} - {format(new Date(recording.createdAt), "MMM d, yyyy")}
                            </SelectItem>
                          ))
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="share-email">Recipient Email</Label>
                  <Input
                    id="share-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={shareDocumentEmail}
                    onChange={(e) => setShareDocumentEmail(e.target.value)}
                    data-testid="input-share-email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can also send to yourself for backup
                  </p>
                </div>
                <Button
                  onClick={handleShareDocument}
                  disabled={shareDocumentMutation.isPending || !selectedDocumentId || !shareDocumentEmail}
                  className="w-full"
                  data-testid="button-share-document"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {shareDocumentMutation.isPending ? "Sending..." : "Share Document"}
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Download Document</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Download your consent documents to share them manually
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Go to Contracts",
                    description: "Visit the Contracts page to download your documents.",
                  });
                }}
                data-testid="button-goto-contracts"
              >
                <Download className="h-4 w-4 mr-2" />
                Go to Contracts Page
              </Button>
            </Card>
          </TabsContent>

          {/* Invite Friends Tab */}
          <TabsContent value="invite" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Send Invitation</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="invite-email">Friend's Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-invite-email"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="invite-message"
                    placeholder="Join me on PMY for secure Title IX consent documentation!"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    data-testid="textarea-invite-message"
                  />
                </div>
                <Button
                  onClick={handleSendInvite}
                  disabled={createReferralMutation.isPending || !inviteEmail}
                  className="w-full"
                  data-testid="button-send-invite"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {createReferralMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Share Referral Link</h3>
              <div className="space-y-3">
                <div>
                  <Label>Your Referral Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={referralData?.referralCode || "Loading..."}
                      readOnly
                      data-testid="input-referral-code"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferralCode}
                      data-testid="button-copy-code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Referral Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={referralLink || "Loading..."}
                      readOnly
                      data-testid="input-referral-link"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferralLink}
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Share your referral link by showing this QR code
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {referralLink ? (
                  <QRCodeSVG value={referralLink} size={200} data-testid="qr-code" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-muted rounded flex items-center justify-center">
                    Loading...
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Referrals Dashboard Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Total Invites</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.completed || 0}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.pending || 0}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Referral History</h3>
              <div className="space-y-3">
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No referrals yet</p>
                    <p className="text-xs">Start inviting friends to earn rewards!</p>
                  </div>
                ) : (
                  referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`referral-${referral.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {referral.refereeEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(referral.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div>
                        {referral.status === "completed" ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Joined
                          </Badge>
                        ) : referral.status === "pending" ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Cancelled
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                Referral Rewards
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Earn rewards when your friends join PMY! Future benefits may include premium
                features, verified policy access, and more.
              </p>
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
