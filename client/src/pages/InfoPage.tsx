import { useState } from "react";
import UniversitySelector from "@/components/UniversitySelector";
import TitleIXInfo from "@/components/TitleIXInfo";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const mockUniversities = [
  { id: "1", name: "Harvard University", state: "Massachusetts" },
  { id: "2", name: "Stanford University", state: "California" },
  { id: "3", name: "Yale University", state: "Connecticut" },
  { id: "4", name: "Princeton University", state: "New Jersey" },
  { id: "5", name: "Columbia University", state: "New York" },
  { id: "6", name: "MIT", state: "Massachusetts" },
  { id: "7", name: "University of Pennsylvania", state: "Pennsylvania" },
  { id: "8", name: "Duke University", state: "North Carolina" },
  { id: "9", name: "Northwestern University", state: "Illinois" },
  { id: "10", name: "Cornell University", state: "New York" },
];

export default function InfoPage() {
  const [selectedUniversity, setSelectedUniversity] = useState(mockUniversities[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Title IX Information</h1>
        <p className="text-muted-foreground">
          Understand consent requirements for your institution
        </p>
      </div>

      <UniversitySelector
        universities={mockUniversities}
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
