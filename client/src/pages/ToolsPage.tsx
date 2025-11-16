import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Shield, CheckCircle, ArrowRight } from "lucide-react";
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
    id: "title-ix",
    title: "Title IX",
    description: "Access university Title IX policies and educational resources about consent requirements.",
    icon: <School className="h-6 w-6" />,
    iconBgColor: "bg-blue-500/10 dark:bg-blue-400/10",
    action: {
      label: "View Policies",
      path: "/titleix"
    }
  },
  {
    id: "id-verify",
    title: "ID Verify",
    description: "Verify identity and age using third-party verification services for enhanced security.",
    icon: <Shield className="h-6 w-6" />,
    iconBgColor: "bg-success/10",
    action: {
      label: "Get Verified",
      path: "/settings/integrations"
    }
  },
  {
    id: "status-check",
    title: "Status Check",
    description: "Check the status and validity of your consent documentation and contracts.",
    icon: <CheckCircle className="h-6 w-6" />,
    iconBgColor: "bg-purple-500/10 dark:bg-purple-400/10",
    action: {
      label: "Check Status",
      path: "/files"
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
