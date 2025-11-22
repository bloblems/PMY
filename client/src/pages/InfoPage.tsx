import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import UniversitySelector from "@/components/UniversitySelector";
import TitleIXInfo from "@/components/TitleIXInfo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface University {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export default function InfoPage() {
  const [, navigate] = useLocation();
  const { data: rawUniversities = [], isLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  // Sort universities alphabetically by name
  const universities = [...rawUniversities].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successType = params.get('success');
    
    if (successType === 'login') {
      setSuccessMessage("You've successfully logged in.");
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } else if (successType === 'signup') {
      setSuccessMessage("Your account has been created.");
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  }, []);

  const handleContinue = () => {
    if (selectedUniversity) {
      const params = new URLSearchParams({
        universityId: selectedUniversity.id,
        universityName: selectedUniversity.name,
      });
      navigate(`/?${params.toString()}`);
    }
  };

  // Auto-select first university when data loads
  useEffect(() => {
    if (universities.length > 0 && !selectedUniversity) {
      setSelectedUniversity(universities[0]);
    }
  }, [universities, selectedUniversity]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Title IX Information</h1>
          <p className="text-muted-foreground">
            Learn about Title IX requirements at your institution.
          </p>
        </div>
        <Card className="p-12">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-muted-foreground animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Loading universities...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Title IX Information</h1>
        <p className="text-muted-foreground">
          Learn about Title IX requirements at your institution.
        </p>
      </div>

      {successMessage && (
        <Alert className="border-success/20 bg-success/10" data-testid="alert-success">
          <AlertDescription className="text-success-foreground">{successMessage}</AlertDescription>
        </Alert>
      )}

      <UniversitySelector
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelect={setSelectedUniversity}
      />
      {selectedUniversity && (
        <div className="flex justify-center">
          <Button 
            onClick={handleContinue}
            size="lg"
            className="gap-2"
            data-testid="button-continue"
          >
            Continue to Home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {selectedUniversity ? (
        <TitleIXInfo
          universityId={selectedUniversity.id}
          universityName={selectedUniversity.name}
          titleIXInfo={selectedUniversity.titleIXInfo}
          titleIXUrl={selectedUniversity.titleIXUrl}
          lastUpdated={format(new Date(selectedUniversity.lastUpdated), "MMMM d, yyyy")}
          verifiedAt={selectedUniversity.verifiedAt}
        />
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Select a University</h3>
            <p className="text-sm text-muted-foreground">
              Choose your institution to view Title IX information
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
