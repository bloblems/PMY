import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, Camera, FileCheck, Fingerprint, ShieldCheck, Zap } from "lucide-react";

type IntegrationStatus = "available" | "coming-soon" | "setup-required";

interface ToolIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  features: string[];
  pricing?: string;
  docsUrl?: string;
}

const tools: ToolIntegration[] = [
  {
    id: "stripe-identity",
    name: "Stripe Identity",
    description: "AI-powered ID verification with selfie matching in ~15 seconds. Perfect for existing Stripe users.",
    category: "ID Verification",
    icon: <ShieldCheck className="h-5 w-5" />,
    status: "available",
    features: ["Government ID verification", "Selfie matching", "30+ countries", "Encrypted data"],
    pricing: "Integrated with Stripe",
    docsUrl: "https://stripe.com/docs/identity"
  },
  {
    id: "persona",
    name: "Persona",
    description: "Configurable ID verification with dynamic workflows and fraud analytics for 200+ countries.",
    category: "ID Verification",
    icon: <Shield className="h-5 w-5" />,
    status: "coming-soon",
    features: ["Dynamic flows", "200+ countries", "Fraud analytics", "REST & GraphQL API"],
    pricing: "Pay per conversion",
    docsUrl: "https://withpersona.com/docs"
  },
  {
    id: "onfido",
    name: "Onfido (Entrust IDV)",
    description: "Enterprise-grade biometric verification with AI-powered fraud detection across 195 countries.",
    category: "ID Verification",
    icon: <Fingerprint className="h-5 w-5" />,
    status: "coming-soon",
    features: ["Biometric verification", "2,500+ document types", "Liveness detection", "24/7 support"],
    pricing: "Enterprise contracts",
    docsUrl: "https://onfido.com/developers"
  },
  {
    id: "veriff",
    name: "Veriff",
    description: "Ultra-fast verification in 6 seconds with 98% automation across 230 countries.",
    category: "ID Verification",
    icon: <Zap className="h-5 w-5" />,
    status: "coming-soon",
    features: ["6s avg decision", "11,000+ documents", "98% automation", "230 countries"],
    pricing: "Pay-as-you-go",
    docsUrl: "https://veriff.com"
  },
  {
    id: "sumsub",
    name: "Sumsub",
    description: "All-in-one KYC/AML/KYB platform with payment fraud prevention and fast integration.",
    category: "ID & Age Verification",
    icon: <FileCheck className="h-5 w-5" />,
    status: "coming-soon",
    features: ["KYC/AML/KYB", "Face authentication", "Payment fraud prevention", "Fast integration"],
    pricing: "Transactional",
    docsUrl: "https://sumsub.com"
  },
  {
    id: "idenfy",
    name: "iDenfy",
    description: "Affordable ID verification with 0.02s checks and pay-per-approved-verification pricing.",
    category: "Age Verification",
    icon: <Camera className="h-5 w-5" />,
    status: "coming-soon",
    features: ["0.02s checks", "Pay per success", "Affordable for SMBs", "Fast setup"],
    pricing: "Pay per approved verification",
    docsUrl: "https://www.idenfy.com"
  }
];

export default function ToolsPage() {
  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="text-xs">Available</Badge>;
      case "setup-required":
        return <Badge variant="outline" className="text-xs">Setup Required</Badge>;
      case "coming-soon":
        return <Badge variant="secondary" className="text-xs">Coming Soon</Badge>;
    }
  };

  const categories = Array.from(new Set(tools.map(t => t.category)));

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Tools & Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Third-party verification services to enhance your consent documentation process.
          </p>
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">{category}</h2>
            <div className="space-y-3">
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <Card key={tool.id} className="p-4" data-testid={`card-tool-${tool.id}`}>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{tool.name}</h3>
                            {getStatusBadge(tool.status)}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {tool.features.map((feature) => (
                            <Badge
                              key={feature}
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        {tool.pricing && (
                          <p className="text-xs text-muted-foreground">
                            Pricing: <span className="font-medium text-foreground">{tool.pricing}</span>
                          </p>
                        )}

                        <div className="flex gap-2">
                          {tool.status === "available" && (
                            <Button
                              size="sm"
                              data-testid={`button-setup-${tool.id}`}
                            >
                              Configure
                            </Button>
                          )}
                          {tool.docsUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(tool.docsUrl, "_blank")}
                              data-testid={`button-docs-${tool.id}`}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Docs
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Need another integration?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We're constantly adding new verification providers. Contact us if you need a specific service integrated.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
