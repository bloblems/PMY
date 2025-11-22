import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Coffee, Briefcase, FileText, Download, Trash2, Check, X, Edit, Clock, Image as ImageIcon, Pause, Play } from "lucide-react";
import { format } from "date-fns";

interface ContractTileProps {
  id: string;
  encounterType?: string;
  parties?: string[];
  createdAt: string;
  updatedAt?: string;
  status?: string;
  method?: string;
  contractText?: string;
  isCollaborative?: boolean;
  variant: "active" | "draft";
  onDownload?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  onResumeActive?: () => void;
  isPending?: boolean;
}

const getEncounterStyle = (encounterType?: string) => {
  const type = encounterType?.toLowerCase() || "";
  
  if (type.includes("intimate")) {
    return {
      gradient: "bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-purple-500/20 dark:from-pink-500/30 dark:via-rose-500/25 dark:to-purple-500/30",
      accentGradient: "bg-gradient-to-r from-pink-500 to-rose-500",
      icon: <Heart className="h-5 w-5" />,
      iconBg: "bg-pink-500/20 dark:bg-pink-400/30",
      label: "Intimate Encounter"
    };
  }
  
  if (type.includes("date")) {
    return {
      gradient: "bg-gradient-to-br from-purple-500/20 via-violet-500/15 to-indigo-500/20 dark:from-purple-500/30 dark:via-violet-500/25 dark:to-indigo-500/30",
      accentGradient: "bg-gradient-to-r from-purple-500 to-violet-500",
      icon: <Coffee className="h-5 w-5" />,
      iconBg: "bg-purple-500/20 dark:bg-purple-400/30",
      label: "Date"
    };
  }
  
  if (type.includes("medical")) {
    return {
      gradient: "bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-teal-500/20 dark:from-blue-500/30 dark:via-cyan-500/25 dark:to-teal-500/30",
      accentGradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
      icon: <Briefcase className="h-5 w-5" />,
      iconBg: "bg-blue-500/20 dark:bg-blue-400/30",
      label: "Medical Consultation"
    };
  }
  
  return {
    gradient: "bg-gradient-to-br from-slate-500/20 via-gray-500/15 to-zinc-500/20 dark:from-slate-500/30 dark:via-gray-500/25 dark:to-zinc-500/30",
    accentGradient: "bg-gradient-to-r from-slate-500 to-gray-500",
    icon: <FileText className="h-5 w-5" />,
    iconBg: "bg-slate-500/20 dark:bg-slate-400/30",
    label: "Consent Contract"
  };
};

const getMethodBadge = (method?: string) => {
  if (!method) return null;
  
  const badges = {
    signature: { label: "Digital Signature", icon: FileText },
    photo: { label: "Photo Consent", icon: ImageIcon },
    audio: { label: "Audio Recording", icon: Clock },
    biometric: { label: "Biometric Auth", icon: Check }
  };
  
  const badge = badges[method as keyof typeof badges];
  if (!badge) return null;
  
  const Icon = badge.icon;
  return (
    <Badge variant="secondary" className="text-xs">
      <Icon className="h-3 w-3 mr-1" />
      {badge.label}
    </Badge>
  );
};

export default function ContractTile({
  id,
  encounterType,
  parties,
  createdAt,
  updatedAt,
  status,
  method,
  contractText,
  isCollaborative,
  variant,
  onDownload,
  onDelete,
  onApprove,
  onReject,
  onResume,
  onPause,
  onResumeActive,
  isPending
}: ContractTileProps) {
  const style = getEncounterStyle(encounterType);
  const methodBadge = getMethodBadge(method);
  
  return (
    <Card 
      className={`overflow-hidden hover-elevate active-elevate-2 ${variant === "active" ? "cursor-pointer" : ""}`}
      data-testid={`tile-${variant}-${id}`}
    >
      {/* Gradient Header with Accent Bar */}
      <div className="relative">
        {/* Thin accent gradient bar */}
        <div className={`h-1 ${style.accentGradient}`} />
        
        {/* Main gradient background section */}
        <div className={`${style.gradient} p-6 pb-4 backdrop-blur-sm`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2.5 rounded-lg ${style.iconBg} backdrop-blur-sm shrink-0`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 truncate">
                  {style.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(createdAt), "MMM d, yyyy")}
                  {updatedAt && variant === "draft" && ` • Updated ${format(new Date(updatedAt), "MMM d, yyyy")}`}
                </p>
              </div>
            </div>
            
            {/* Status badges */}
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              {variant === "draft" && (
                <Badge variant={status === "pending_approval" ? "secondary" : "outline"} className="text-xs">
                  {status === "pending_approval" ? "Awaiting Approval" : "Draft"}
                </Badge>
              )}
              {variant === "active" && methodBadge}
            </div>
          </div>
          
          {/* Parties involved */}
          {parties && parties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {parties.map((party, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                  {party}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Content section with white/card background */}
      <div className="p-4 space-y-3">
        {/* Contract text preview for drafts */}
        {variant === "draft" && contractText && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {contractText.substring(0, 150)}...
          </p>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Active contract actions */}
          {variant === "active" && status === "active" && (
            <>
              {onPause && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPause}
                  disabled={isPending}
                  data-testid={`button-pause-${id}`}
                >
                  <Pause className="h-4 w-4 mr-1.5" />
                  Pause
                </Button>
              )}
              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDownload}
                  data-testid={`button-download-${id}`}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  data-testid={`button-delete-${id}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </>
          )}
          
          {/* Paused contract actions */}
          {variant === "active" && status === "paused" && (
            <>
              {onResumeActive && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onResumeActive}
                  disabled={isPending}
                  data-testid={`button-resume-${id}`}
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Resume
                </Button>
              )}
              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDownload}
                  data-testid={`button-download-${id}`}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  data-testid={`button-delete-${id}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </>
          )}
          
          {/* Completed contract actions - read-only */}
          {variant === "active" && status === "completed" && (
            <>
              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDownload}
                  data-testid={`button-download-${id}`}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              )}
            </>
          )}
          
          {/* Draft with pending approval (collaborative) */}
          {variant === "draft" && status === "pending_approval" && isCollaborative && (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onApprove}
                  disabled={isPending}
                  data-testid={`button-approve-${id}`}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  disabled={isPending}
                  data-testid={`button-reject-${id}`}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              )}
            </>
          )}
          
          {/* Draft that can be edited (non-collaborative) */}
          {variant === "draft" && !isCollaborative && onResume && (
            <Button
              size="sm"
              variant="default"
              onClick={onResume}
              data-testid={`button-resume-${id}`}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Resume Editing
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
