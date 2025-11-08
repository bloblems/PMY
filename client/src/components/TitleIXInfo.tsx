import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, BookOpen, Shield, Flag, ExternalLink, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TitleIXInfoProps {
  universityId: string;
  universityName: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export default function TitleIXInfo({
  universityId,
  universityName,
  titleIXInfo,
  titleIXUrl,
  lastUpdated,
  verifiedAt,
}: TitleIXInfoProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateSummary = async () => {
      if (!titleIXInfo || titleIXInfo.includes("will be populated soon")) {
        setSummary(titleIXInfo);
        return;
      }

      setIsLoadingSummary(true);
      try {
        const response = await apiRequest("POST", "/api/summarize-policy", {
          titleIXInfo,
        });
        const data = await response.json();
        setSummary(data.summary);
      } catch (error) {
        console.error("Failed to generate summary:", error);
        setSummary(titleIXInfo);
        toast({
          title: "Summary unavailable",
          description: "Displaying full policy information.",
          variant: "default",
        });
      } finally {
        setIsLoadingSummary(false);
      }
    };

    generateSummary();
  }, [titleIXInfo, toast]);

  const handleSubmitReport = async () => {
    if (!reportType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a report type and provide a description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/reports", {
        universityId,
        reportType,
        description: description.trim(),
        status: "pending",
      });

      toast({
        title: "Report submitted",
        description: "Thank you for helping us keep this information accurate.",
      });

      setShowReportDialog(false);
      setReportType("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Title IX at {universityName}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <p className="text-muted-foreground">
                  Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
                </p>
                {verifiedAt && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-xs">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center pt-2 border-t">
            {titleIXUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(titleIXUrl, "_blank")}
                data-testid="button-view-official-policy"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Official Policy
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportDialog(true)}
              data-testid="button-report-issue"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold mb-3">Title IX Policy Information</h4>
        {isLoadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Generating summary...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {isExpanded ? titleIXInfo : summary}
            </p>
            {summary && summary !== titleIXInfo && !titleIXInfo.includes("will be populated soon") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:text-primary"
                data-testid="button-toggle-expand"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Read More
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="consent" className="border rounded-lg px-4 bg-card" data-testid="accordion-consent">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold">Understanding Consent</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <p className="mb-3">
              Consent must be clear, knowing, and voluntary. It is active, not passive, and can be
              withdrawn at any time. Silence or lack of resistance does not constitute consent.
            </p>
            <p className="mb-3">
              Both parties must be capable of giving consent. Incapacitation due to alcohol, drugs,
              or other factors negates the ability to consent.
            </p>
            <p>
              Documentation of consent, while helpful, does not replace the ongoing requirement for
              clear communication throughout any encounter.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="requirements" className="border rounded-lg px-4 bg-card" data-testid="accordion-requirements">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-semibold">Key Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li>Consent must be affirmative and ongoing</li>
              <li>Both parties must be of legal age and mentally capable</li>
              <li>Consent cannot be given under coercion or threat</li>
              <li>Prior relationship does not imply consent for future encounters</li>
              <li>Consent to one activity does not imply consent to others</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="resources" className="border rounded-lg px-4 bg-card" data-testid="accordion-resources">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="font-semibold">Campus Resources</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Title IX Coordinator</p>
                <p>Contact your university's Title IX office for guidance and support.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Health Services</p>
                <p>Confidential counseling and medical support available 24/7.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Campus Security</p>
                <p>Report incidents and access immediate assistance.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent data-testid="dialog-report-issue">
          <DialogHeader>
            <DialogTitle>Report Information Issue</DialogTitle>
            <DialogDescription>
              Help us maintain accurate Title IX information by reporting any outdated or incorrect details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Issue Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" data-testid="select-report-type">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdated_info">Outdated Information</SelectItem>
                  <SelectItem value="incorrect_url">Incorrect URL</SelectItem>
                  <SelectItem value="missing_info">Missing Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={4}
                data-testid="input-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                data-testid="button-cancel-report"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                data-testid="button-submit-report"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
