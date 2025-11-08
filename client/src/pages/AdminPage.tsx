import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Shield, Flag, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface UniversityReport {
  id: string;
  universityId: string;
  reportType: string;
  description: string;
  reportedAt: string;
  status: string;
  resolvedAt: string | null;
}

interface University {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export default function AdminPage() {
  const [selectedReport, setSelectedReport] = useState<UniversityReport | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [editingTitleIX, setEditingTitleIX] = useState(false);
  const [titleIXInfo, setTitleIXInfo] = useState("");
  const [titleIXUrl, setTitleIXUrl] = useState("");
  const { toast } = useToast();

  const { data: reports = [] } = useQuery<UniversityReport[]>({
    queryKey: ["/api/admin/reports/pending"],
  });

  const { data: rawUniversities = [] } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  // Sort universities alphabetically by name
  const universities = [...rawUniversities].sort((a, b) => a.name.localeCompare(b.name));

  const resolveMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiRequest("PATCH", `/api/admin/reports/${reportId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/pending"] });
      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved.",
      });
      setSelectedReport(null);
    },
  });

  const updateTitleIXMutation = useMutation({
    mutationFn: async ({ id, info, url }: { id: string; info: string; url: string }) => {
      await apiRequest("PATCH", `/api/admin/universities/${id}/title-ix`, {
        titleIXInfo: info,
        titleIXUrl: url || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
      toast({
        title: "University updated",
        description: "Title IX information has been updated successfully.",
      });
      setEditingTitleIX(false);
      setSelectedUniversity(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await apiRequest("PATCH", `/api/admin/universities/${universityId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
      toast({
        title: "University verified",
        description: "The university information has been marked as verified.",
      });
    },
  });

  const handleEditUniversity = (report: UniversityReport) => {
    const uni = universities.find(u => u.id === report.universityId);
    if (uni) {
      setSelectedUniversity(uni);
      setTitleIXInfo(uni.titleIXInfo);
      setTitleIXUrl(uni.titleIXUrl || "");
      setEditingTitleIX(true);
    }
  };

  const handleSaveTitleIX = () => {
    if (selectedUniversity && titleIXInfo.trim()) {
      updateTitleIXMutation.mutate({
        id: selectedUniversity.id,
        info: titleIXInfo.trim(),
        url: titleIXUrl.trim(),
      });
    }
  };

  const getReportTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "outdated_info": return "destructive";
      case "incorrect_url": return "secondary";
      case "missing_info": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage Title IX information and review user reports
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Pending Reports</h2>
          </div>
          <Badge variant="outline">{reports.length} pending</Badge>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending reports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const university = universities.find(u => u.id === report.universityId);
              return (
                <Card key={report.id} className="p-4 hover-elevate" data-testid={`report-card-${report.id}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{university?.name || "Unknown University"}</h3>
                          <Badge variant={getReportTypeBadgeVariant(report.reportType)} className="text-xs">
                            {report.reportType.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reported {format(new Date(report.reportedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{report.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUniversity(report)}
                        data-testid={`button-edit-${report.id}`}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Edit Title IX Info
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate(report.id)}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-resolve-${report.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">University Management</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {universities.filter(u => u.verifiedAt).length} of {universities.length} universities verified
        </p>
        <div className="grid gap-2 max-h-96 overflow-y-auto">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
              data-testid={`university-row-${uni.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{uni.name}</p>
                  {uni.verifiedAt && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {format(new Date(uni.lastUpdated), "MMM d, yyyy")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedUniversity(uni);
                  setTitleIXInfo(uni.titleIXInfo);
                  setTitleIXUrl(uni.titleIXUrl || "");
                  setEditingTitleIX(true);
                }}
                data-testid={`button-edit-uni-${uni.id}`}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={editingTitleIX} onOpenChange={setEditingTitleIX}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-titleix">
          <DialogHeader>
            <DialogTitle>Edit Title IX Information</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedUniversity?.name}</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titleix-url">Official Title IX Policy URL</Label>
              <Input
                id="titleix-url"
                value={titleIXUrl}
                onChange={(e) => setTitleIXUrl(e.target.value)}
                placeholder="https://university.edu/title-ix"
                data-testid="input-titleix-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleix-info">Title IX Policy Information</Label>
              <Textarea
                id="titleix-info"
                value={titleIXInfo}
                onChange={(e) => setTitleIXInfo(e.target.value)}
                rows={8}
                placeholder="Enter detailed Title IX policy information..."
                data-testid="input-titleix-info"
              />
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => selectedUniversity && verifyMutation.mutate(selectedUniversity.id)}
                disabled={verifyMutation.isPending}
                data-testid="button-verify-uni"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Verified
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingTitleIX(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTitleIX}
                  disabled={updateTitleIXMutation.isPending || !titleIXInfo.trim()}
                  data-testid="button-save-titleix"
                >
                  {updateTitleIXMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
