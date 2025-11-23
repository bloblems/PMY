import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Shield, CheckCircle, ArrowRight, Scale } from "lucide-react";
import { useLocation } from "wouter";

interface ToolPanel {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  action: {
    label: string;
    path: string;
  };
}

const toolPanels: ToolPanel[] = [
  {
    id: "partner-verify",
    title: "Partner Verify",
    description: "Verify identity and age using third-party verification services for enhanced security.",
    icon: <Shield className="h-6 w-6" />,
    iconBgColor: "bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-rose-600/20 dark:from-pink-500/30 dark:via-rose-500/25 dark:to-rose-600/30",
    action: {
      label: "Get Verified",
      path: "/settings/integrations"
    }
  },
  {
    id: "contract-verify",
    title: "Contract Verify",
    description: "Check the status and validity of your consent documentation and contracts.",
    icon: <CheckCircle className="h-6 w-6" />,
    iconBgColor: "bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 dark:from-emerald-500/30 dark:via-green-500/25 dark:to-teal-500/30",
    action: {
      label: "Check Status",
      path: "/files"
    }
  },
  {
    id: "title-ix",
    title: "Title IX",
    description: "Access university Title IX policies and educational resources about consent requirements.",
    icon: <School className="h-6 w-6" />,
    iconBgColor: "bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-sky-500/20 dark:from-blue-500/30 dark:via-cyan-500/25 dark:to-sky-500/30",
    action: {
      label: "View Policies",
      path: "/titleix"
    }
  },
  {
    id: "state-law",
    title: "State Law",
    description: "Explore consent laws and requirements across all 50 U.S. states for comprehensive legal understanding.",
    icon: <Scale className="h-6 w-6" />,
    iconBgColor: "bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 dark:from-amber-500/30 dark:via-yellow-500/25 dark:to-orange-500/30",
    action: {
      label: "View State Laws",
      path: "/state-law"
    }
  }
];

export default function ToolsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Tools</h1>
          <p className="text-sm text-muted-foreground">
            Quick access to essential features and verification services.
          </p>
        </div>

        <div className="space-y-3">
          {toolPanels.map((panel) => (
            <Card
              key={panel.id}
              className="p-5 hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => setLocation(panel.action.path)}
              data-testid={`card-tool-${panel.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${panel.iconBgColor}`}>
                  {panel.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base">{panel.title}</h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {panel.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(panel.action.path);
                    }}
                    data-testid={`button-${panel.id}`}
                  >
                    {panel.action.label}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
