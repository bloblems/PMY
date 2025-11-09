import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UniversitySelector from "@/components/UniversitySelector";
import TitleIXInfo from "@/components/TitleIXInfo";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
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
  const { data: rawUniversities = [], isLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  // Sort universities alphabetically by name
  const universities = [...rawUniversities].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

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
            Understand consent requirements for your institution
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
          Understand consent requirements for your institution
        </p>
      </div>

      <UniversitySelector
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelect={setSelectedUniversity}
      />

      {selectedUniversity && (
        <Card className="p-8 border-2 border-green-600 dark:border-green-400 hover-elevate active-elevate-2 cursor-pointer transition-transform" data-testid="button-press-for-yes">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Press for Yes</h2>
            <p className="text-muted-foreground text-sm">Begin consent documentation</p>
          </div>
        </Card>
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
