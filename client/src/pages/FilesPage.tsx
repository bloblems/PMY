import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FileList from "@/components/FileList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, Coffee, Briefcase, FileText, ArrowRight, Inbox, FilePlus, Check, X, Clock, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

interface Recording {
  id: string;
  filename: string;
  fileUrl: string;
  duration: string;
  createdAt: string;
  universityId?: string;
  encounterType?: string;
  parties?: string[];
}

interface Contract {
  id: string;
  contractText: string;
  signature1: string;
  signature2: string;
  createdAt: string;
  universityId?: string;
  encounterType?: string;
  parties?: string[];
  method?: string;
  photoUrl?: string;
  status?: string;
  isCollaborative?: boolean;
}

interface DraftContract {
  id: string;
  contractText: string;
  createdAt: string;
  updatedAt?: string;
  universityId?: string;
  encounterType?: string;
  parties?: string[];
  status: "draft" | "pending_approval";
  isCollaborative: boolean;
}

interface ContractInvitation {
  id: string;
  contractId: string;
  senderEmail: string;
  recipientEmail: string;
  invitationCode: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  encounterType: string;
  iconBgColor: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: "intimate-encounter",
    name: "Intimate Encounter",
    description: "Comprehensive consent documentation for intimate activities with Title IX compliance.",
    icon: <Heart className="h-5 w-5" />,
    encounterType: "Intimate Encounter",
    iconBgColor: "bg-pink-500/10 dark:bg-pink-400/10"
  },
  {
    id: "date",
    name: "Date",
    description: "Clear consent agreement for romantic encounters and social dates.",
    icon: <Coffee className="h-5 w-5" />,
    encounterType: "Date",
    iconBgColor: "bg-purple-500/10 dark:bg-purple-400/10"
  },
  {
    id: "medical",
    name: "Medical Consultation",
    description: "Professional consent documentation for medical examinations and consultations.",
    icon: <Briefcase className="h-5 w-5" />,
    encounterType: "Medical Consultation",
    iconBgColor: "bg-blue-500/10 dark:bg-blue-400/10"
  }
];

export default function FilesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  // Fetch drafts
  const { data: drafts = [] } = useQuery<DraftContract[]>({
    queryKey: ["/api/contracts/drafts"],
  });

  // Fetch invitations
  const { data: invitations = [] } = useQuery<ContractInvitation[]>({
    queryKey: ["/api/contracts/invitations"],
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/recordings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({
        title: "File deleted",
        description: "Recording has been removed",
      });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/contracts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "File deleted",
        description: "Contract has been removed",
      });
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationCode: string) => {
      const response = await apiRequest("POST", `/api/contracts/invitations/${invitationCode}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Invitation accepted",
        description: "You can now review and approve the contract",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  // Approve contract mutation
  const approveContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract approved",
        description: "Your approval has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve contract",
        variant: "destructive",
      });
    },
  });

  // Reject contract mutation
  const rejectContractMutation = useMutation({
    mutationFn: async ({ contractId, reason }: { contractId: string; reason?: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract rejected",
        description: "The contract has been rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject contract",
        variant: "destructive",
      });
    },
  });

  // Combine and format files
  const files = [
    ...recordings.map((r) => ({
      id: r.id,
      name: r.filename,
      type: "audio" as const,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      duration: r.duration,
      fileUrl: r.fileUrl,
      encounterType: r.encounterType,
      parties: r.parties,
    })),
    ...contracts.map((c) => ({
      id: c.id,
      name: c.method === "photo" 
        ? `photo-consent-${new Date(c.createdAt).toLocaleDateString().replace(/\//g, "-")}`
        : `contract-${new Date(c.createdAt).toLocaleDateString().replace(/\//g, "-")}.pdf`,
      type: "contract" as const,
      date: new Date(c.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      signature1: c.signature1,
      signature2: c.signature2,
      encounterType: c.encounterType,
      parties: c.parties,
      method: c.method,
      photoUrl: c.photoUrl,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownload = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    if (file.type === "audio" && "fileUrl" in file) {
      // Download audio file
      const a = document.createElement("a");
      a.href = file.fileUrl;
      a.download = file.name;
      a.click();
      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      });
    } else if (file.type === "contract") {
      try {
        // Fetch the contract data
        const response = await fetch(`/api/contracts/${id}`);
        if (!response.ok) throw new Error("Failed to fetch contract");
        
        const contractData = await response.json();
        
        // Build encounter details section
        const encounterDetails = contractData.encounterType || contractData.parties?.length > 0 ? `
  <div class="encounter-details">
    ${contractData.encounterType ? `<p><strong>Encounter Type:</strong> ${contractData.encounterType}</p>` : ''}
    ${contractData.parties?.length > 0 ? `<p><strong>Parties Involved:</strong> ${contractData.parties.join(', ')}</p>` : ''}
    ${contractData.method ? `<p><strong>Method:</strong> ${contractData.method}</p>` : ''}
  </div>` : '';

        // Create a simple HTML representation of the contract
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consent Contract - ${file.date}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { text-align: center; margin-bottom: 30px; }
    .encounter-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .encounter-details p { margin: 5px 0; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .signature { flex: 1; }
    .signature img { border: 2px solid #ccc; width: 100%; max-width: 300px; }
    .signature-label { font-weight: bold; margin-bottom: 10px; }
    .photo { text-align: center; margin-top: 30px; }
    .photo img { max-width: 100%; border: 2px solid #ccc; }
    .timestamp { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  ${encounterDetails}
  <pre>${contractData.contractText}</pre>
  ${contractData.photoUrl ? `
  <div class="photo">
    <div class="signature-label">Consent Photo:</div>
    <img src="${contractData.photoUrl}" alt="Consent Photo" />
  </div>` : `
  <div class="signatures">
    <div class="signature">
      <div class="signature-label">Signature 1:</div>
      <img src="${contractData.signature1}" alt="Signature 1" />
    </div>
    <div class="signature">
      <div class="signature-label">Signature 2:</div>
      <img src="${contractData.signature2}" alt="Signature 2" />
    </div>
  </div>`}
  <div class="timestamp">
    Signed on ${new Date(contractData.createdAt).toLocaleString()}
  </div>
</body>
</html>`;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(".pdf", ".html");
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download contract",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    if (file.type === "audio") {
      deleteRecordingMutation.mutate(id);
    } else {
      deleteContractMutation.mutate(id);
    }
  };

  const handleUseTemplate = (encounterType: string) => {
    setLocation(`/?encounter=${encodeURIComponent(encounterType)}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage documents, drafts, and invitations
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active" data-testid="tab-active-contracts">
              <FileText className="h-4 w-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="drafts" data-testid="tab-drafts">
              <FilePlus className="h-4 w-4 mr-2" />
              Drafts {drafts.length > 0 && <Badge variant="secondary" className="ml-2">{drafts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox {invitations.length > 0 && <Badge variant="secondary" className="ml-2">{invitations.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Active Contracts Tab */}
          <TabsContent value="active" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-3">Saved Documents</h2>
                <FileList files={files} onDownload={handleDownload} onDelete={handleDelete} />
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Template Contract Types</h2>
                <div className="space-y-3">
                  {contractTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => handleUseTemplate(template.encounterType)}
                      data-testid={`card-template-${template.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${template.iconBgColor}`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                            {template.description}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template.encounterType);
                            }}
                            data-testid={`button-use-${template.id}`}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3">Draft Contracts</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Review and approve collaborative contracts awaiting your approval
              </p>
              {drafts.length === 0 ? (
                <Card className="p-8 text-center">
                  <FilePlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No drafts found</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <Card key={draft.id} className="p-4" data-testid={`card-draft-${draft.id}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {draft.encounterType || "Consent Contract"}
                              </h3>
                              <Badge variant={draft.status === "pending_approval" ? "secondary" : "outline"}>
                                {draft.status === "pending_approval" ? "Awaiting Approval" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Created {format(new Date(draft.createdAt), "MMM d, yyyy")}
                              {draft.updatedAt && ` • Updated ${format(new Date(draft.updatedAt), "MMM d, yyyy")}`}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {draft.contractText.substring(0, 150)}...
                            </p>
                          </div>
                        </div>
                        
                        {draft.status === "pending_approval" && draft.isCollaborative && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveContractMutation.mutate(draft.id)}
                              disabled={approveContractMutation.isPending}
                              data-testid={`button-approve-${draft.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectContractMutation.mutate({ contractId: draft.id })}
                              disabled={rejectContractMutation.isPending}
                              data-testid={`button-reject-${draft.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {!draft.isCollaborative && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => navigate(`/?resumeDraftId=${draft.id}`)}
                              data-testid={`button-resume-${draft.id}`}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Resume Editing
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3">Invitations</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Accept invitations to collaborate on consent contracts
              </p>
              {invitations.length === 0 ? (
                <Card className="p-8 text-center">
                  <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invitations.filter(inv => inv.status === "pending").map((invitation) => (
                    <Card key={invitation.id} className="p-4" data-testid={`card-invitation-${invitation.id}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">Contract Invitation</h3>
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              From: <span className="font-medium">{invitation.senderEmail}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Received {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                              {' • '}
                              Expires {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => acceptInvitationMutation.mutate(invitation.invitationCode)}
                            disabled={acceptInvitationMutation.isPending}
                            data-testid={`button-accept-invitation-${invitation.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
