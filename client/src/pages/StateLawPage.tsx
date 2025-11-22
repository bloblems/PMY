import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, MapPin, Info, CheckCircle2 } from "lucide-react";
import type { StateLaw } from "@shared/schema";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

export default function StateLawPage() {
  const [selectedState, setSelectedState] = useState<string>("");

  const { data: stateLaw, isLoading } = useQuery<StateLaw>({
    queryKey: ['/api/state-laws', selectedState],
    enabled: !!selectedState,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-7 w-7" />
            State Consent Laws
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore consent laws and legal requirements across all 50 U.S. states to understand your rights and responsibilities.
          </p>
        </div>

        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-amber-500" />
              Disclaimer
            </CardTitle>
            <CardDescription className="text-xs">
              This information is for educational purposes only and does not constitute legal advice. 
              Consent laws vary by state and can change. Always consult with a qualified attorney for 
              legal guidance specific to your situation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Your State
            </CardTitle>
            <CardDescription>
              Choose a state to view its specific consent laws and requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full" data-testid="select-state">
                <SelectValue placeholder="Select a state..." />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedState && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {US_STATES.find(s => s.code === selectedState)?.name} Consent Laws
                </CardTitle>
                {stateLaw?.verifiedAt && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <CardDescription>
                Detailed information about consent requirements in {US_STATES.find(s => s.code === selectedState)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : stateLaw ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Age of Consent
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stateLaw.ageOfConsent} years old
                      </p>
                    </div>

                    {stateLaw.romeoJulietLaw && (
                      <div className="rounded-lg border bg-card p-4 space-y-2">
                        <h3 className="font-semibold text-sm">Romeo and Juliet Law</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {stateLaw.romeoJulietLaw}
                        </p>
                      </div>
                    )}

                    {stateLaw.affirmativeConsentRequired && (
                      <div className="rounded-lg border bg-card p-4 space-y-2">
                        <h3 className="font-semibold text-sm">Affirmative Consent Required</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {stateLaw.affirmativeConsentRequired}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <h3 className="font-semibold text-sm">Consent Law Overview</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {stateLaw.consentLawInfo}
                      </p>
                    </div>

                    {stateLaw.reportingRequirements && (
                      <div className="rounded-lg border bg-card p-4 space-y-2">
                        <h3 className="font-semibold text-sm">Reporting Requirements</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {stateLaw.reportingRequirements}
                        </p>
                      </div>
                    )}

                    {stateLaw.sourceUrl && (
                      <div className="rounded-lg border bg-card p-4 space-y-2">
                        <h3 className="font-semibold text-sm">Official Source</h3>
                        <a
                          href={stateLaw.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                          data-testid="link-source"
                        >
                          View Official State Law Documentation
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(stateLaw.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    State-specific consent law information is currently being compiled. 
                    This feature will be available soon with comprehensive details about consent laws in {US_STATES.find(s => s.code === selectedState)?.name}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why State Laws Matter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              While Title IX provides federal protections in educational settings, state laws govern 
              consent requirements in most other contexts. Understanding your state's specific laws is 
              crucial for:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Knowing the legal age of consent in your jurisdiction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Understanding how consent is legally defined and documented</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Recognizing situations where consent cannot be given</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Being aware of reporting obligations and available resources</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
