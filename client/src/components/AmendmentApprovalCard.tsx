import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface Amendment {
  id: string;
  contractId: string;
  requestedBy: string;
  amendmentType: string;
  status: string;
  changes: string;
  reason: string;
  approvers: string[] | null;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
}

interface AmendmentApprovalCardProps {
  amendment: Amendment;
  currentUserId: string;
  currentActs: {
    touching: boolean;
    kissing: boolean;
    oral: boolean;
    anal: boolean;
    vaginal: boolean;
  };
  currentEndTime?: string;
  onApprove: (amendmentId: string) => Promise<void>;
  onReject: (amendmentId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const actLabels = {
  touching: "Touching",
  kissing: "Kissing",
  oral: "Oral",
  anal: "Anal",
  vaginal: "Vaginal",
};

export function AmendmentApprovalCard({
  amendment,
  currentUserId,
  currentActs,
  currentEndTime,
  onApprove,
  onReject,
  isLoading,
}: AmendmentApprovalCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse changes JSON with error handling
  let changes: { addedActs?: string[]; removedActs?: string[]; newEndTime?: string } = {};
  let parseError = false;
  try {
    changes = JSON.parse(amendment.changes);
  } catch (error) {
    console.error("Failed to parse amendment changes:", error);
    parseError = true;
  }

  const isRequester = amendment.requestedBy === currentUserId;
  const hasApproved = amendment.approvers?.includes(currentUserId) || false;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(amendment.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(amendment.id, rejectReason || undefined);
      setShowRejectDialog(false);
      setRejectReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAmendmentTypeLabel = () => {
    switch (amendment.amendmentType) {
      case "add_acts": return "Add Intimate Acts";
      case "remove_acts": return "Remove Intimate Acts";
      case "extend_duration": return "Extend Duration";
      case "shorten_duration": return "Shorten Duration";
      default: return amendment.amendmentType;
    }
  };

  const getStatusBadge = () => {
    if (amendment.status === "approved") {
      return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    }
    if (amendment.status === "rejected") {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>;
  };

  // Show error state if changes couldn't be parsed
  if (parseError) {
    return (
      <Card data-testid={`card-amendment-${amendment.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">
                {getAmendmentTypeLabel()}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3" />
                Requested {format(new Date(amendment.createdAt), "PPP")}
              </CardDescription>
            </div>
            <Badge variant="destructive">Error</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md">
            <p className="text-sm text-destructive font-medium mb-1">Unable to display amendment</p>
            <p className="text-sm text-destructive/90">
              The amendment data is malformed and cannot be displayed. Please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`card-amendment-${amendment.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {getAmendmentTypeLabel()}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              Requested {format(new Date(amendment.createdAt), "PPP")}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Requester info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{isRequester ? "You requested" : "Requested by partner"}</span>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Reason</Label>
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {amendment.reason}
          </p>
        </div>

        <Separator />

        {/* Changes comparison */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Proposed Changes</Label>
          
          {(amendment.amendmentType === "add_acts" || amendment.amendmentType === "remove_acts") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Current Acts</p>
                <div className="space-y-1">
                  {Object.entries(currentActs).filter(([_, allowed]) => allowed).map(([act]) => (
                    <div key={act} className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                      {actLabels[act as keyof typeof actLabels]}
                    </div>
                  ))}
                  {Object.values(currentActs).every(v => !v) && (
                    <p className="text-sm text-muted-foreground italic">None selected</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {amendment.amendmentType === "add_acts" ? "Acts to Add" : "Acts to Remove"}
                </p>
                <div className="space-y-1">
                  {amendment.amendmentType === "add_acts" && changes.addedActs?.map((act: string) => (
                    <div key={act} className="text-sm flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      {actLabels[act as keyof typeof actLabels]}
                    </div>
                  ))}
                  {amendment.amendmentType === "remove_acts" && changes.removedActs?.map((act: string) => (
                    <div key={act} className="text-sm flex items-center gap-2 text-destructive">
                      <XCircle className="w-3 h-3" />
                      {actLabels[act as keyof typeof actLabels]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(amendment.amendmentType === "extend_duration" || amendment.amendmentType === "shorten_duration") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Current End Time</p>
                <p className="text-sm">
                  {currentEndTime ? format(new Date(currentEndTime), "PPP p") : "No end time"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {amendment.amendmentType === "extend_duration" ? "New End Time" : "New End Time"}
                </p>
                <p className="text-sm font-medium">
                  {changes.newEndTime ? format(new Date(changes.newEndTime), "PPP p") : "Not specified"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Approval status */}
        {amendment.status === "pending" && amendment.approvers && amendment.approvers.length > 0 && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-medium text-muted-foreground mb-1">Approval Status</p>
            <p className="text-sm">
              {amendment.approvers.length} of 2 parties have approved
            </p>
          </div>
        )}

        {/* Rejection info */}
        {amendment.status === "rejected" && amendment.rejectionReason && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            <p className="text-xs font-medium text-destructive mb-1">Rejection Reason</p>
            <p className="text-sm text-destructive/90">{amendment.rejectionReason}</p>
          </div>
        )}
      </CardContent>

      {amendment.status === "pending" && !showRejectDialog && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(true)}
            disabled={isSubmitting || isLoading}
            data-testid={`button-reject-${amendment.id}`}
          >
            Reject
          </Button>
          {!isRequester && !hasApproved && (
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || isLoading}
              data-testid={`button-approve-${amendment.id}`}
            >
              {isSubmitting || isLoading ? "Approving..." : "Approve Amendment"}
            </Button>
          )}
          {hasApproved && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              You approved this
            </Badge>
          )}
          {isRequester && (
            <Badge variant="secondary" className="ml-auto">
              Waiting for partner approval
            </Badge>
          )}
        </CardFooter>
      )}

      {showRejectDialog && (
        <CardFooter className="flex-col items-stretch gap-3">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason (Optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why you're rejecting this amendment..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-reject-reason"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              disabled={isSubmitting || isLoading}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || isLoading}
              data-testid="button-confirm-reject"
            >
              {isSubmitting || isLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
