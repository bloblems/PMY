import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, ExternalLink, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UniversityPolicyPreviewProps {
  universityId: string;
  universityName: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export default function UniversityPolicyPreview({
  universityId,
  universityName,
  titleIXInfo,
  titleIXUrl,
  lastUpdated,
  verifiedAt,
}: UniversityPolicyPreviewProps) {
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
  }, [titleIXInfo, universityName, toast]);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <School className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{universityName}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
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
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Policy Summary</h4>
            {!titleIXInfo.includes("will be populated soon") && (
              <span className="text-xs text-muted-foreground">AI-generated</span>
            )}
          </div>
          {isLoadingSummary ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Generating...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isExpanded ? titleIXInfo : summary}
              </p>
              <div className="flex gap-2">
                {summary && summary !== titleIXInfo && !titleIXInfo.includes("will be populated soon") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary hover:text-primary h-7 text-xs"
                    data-testid="button-toggle-expand"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        More
                      </>
                    )}
                  </Button>
                )}
                {titleIXUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(titleIXUrl, "_blank")}
                    className="h-7 text-xs"
                    data-testid="button-view-full-policy"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Full Policy
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
