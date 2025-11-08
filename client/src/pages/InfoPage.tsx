import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UniversitySelector from "@/components/UniversitySelector";
import TitleIXInfo from "@/components/TitleIXInfo";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface University {
  id: string;
  name: string;
  state: string;
}

export default function InfoPage() {
  const { data: universities = [], isLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

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

      {selectedUniversity ? (
        <TitleIXInfo
          universityName={selectedUniversity.name}
          lastUpdated="November 2025"
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
