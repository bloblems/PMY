import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import UniversitySelector from "@/components/UniversitySelector";
import TitleIXInfo from "@/components/TitleIXInfo";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [, navigate] = useLocation();
  const { data: rawUniversities = [], isLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  // Sort universities alphabetically by name
  const universities = [...rawUniversities].sort((a, b) => a.name.localeCompare(b.name));

  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successType = params.get('success');
    
    if (successType === 'login') {
      setSuccessMessage("You've successfully logged in.");
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
      // Auto-hide after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } else if (successType === 'signup') {
      setSuccessMessage("Your account has been created.");
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
      // Auto-hide after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  }, []);

  const HOLD_DURATION = 3000; // 3 seconds
  const RETREAT_DURATION = 300; // 300ms for quick retreat

  const handlePressForYes = () => {
    if (selectedUniversity) {
      const params = new URLSearchParams({
        universityId: selectedUniversity.id,
        universityName: selectedUniversity.name,
      });
      navigate(`/consent/flow?${params.toString()}`);
    }
  };

  const startHold = () => {
    setIsHolding(true);
    holdStartRef.current = Date.now();

    holdTimerRef.current = setInterval(() => {
      if (holdStartRef.current) {
        const elapsed = Date.now() - holdStartRef.current;
        const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        setHoldProgress(progress);

        if (progress >= 100) {
          stopHold();
          handlePressForYes();
        }
      }
    }, 16); // ~60fps updates
  };

  const stopHold = () => {
    setIsHolding(false);
    holdStartRef.current = null;
    
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Quick retreat animation
    if (holdProgress < 100 && holdProgress > 0) {
      const startProgress = holdProgress;
      const retreatStart = Date.now();

      const retreatInterval = setInterval(() => {
        const elapsed = Date.now() - retreatStart;
        const retreatProgress = (elapsed / RETREAT_DURATION) * 100;
        const newProgress = startProgress - (startProgress * (retreatProgress / 100));
        
        if (newProgress <= 0 || retreatProgress >= 100) {
          setHoldProgress(0);
          clearInterval(retreatInterval);
        } else {
          setHoldProgress(newProgress);
        }
      }, 16);
    } else if (holdProgress >= 100) {
      setHoldProgress(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

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
            Generate the consent required by your institution.
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Title IX Consent</h1>
        <p className="text-muted-foreground">
          Select your institution to generate consent contract.
        </p>
      </div>

      {successMessage && (
        <Alert className="border-green-600/20 bg-green-600/10 dark:border-green-400/20 dark:bg-green-400/10" data-testid="alert-success">
          <AlertDescription className="text-green-900 dark:text-green-100">{successMessage}</AlertDescription>
        </Alert>
      )}

      <UniversitySelector
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelect={setSelectedUniversity}
      />
      {selectedUniversity && (
        <Card 
          className="relative p-8 border-2 border-green-600 dark:border-green-400 cursor-pointer transition-transform overflow-hidden select-none" 
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          data-testid="button-press-for-yes"
        >
          {/* Green fill overlay */}
          <div 
            className="absolute inset-0 bg-green-600/20 dark:bg-green-400/20 pointer-events-none"
            style={{
              width: `${holdProgress}%`,
              transition: isHolding ? 'none' : `width ${RETREAT_DURATION}ms ease-out`,
            }}
          />
          
          <div className="relative text-center space-y-2">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              {holdProgress >= 100 ? "Yes!" : holdProgress > 0 ? "Hold..." : "Press for Yes"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {holdProgress > 0 && holdProgress < 100 
                ? "Keep holding to continue" 
                : "Hold to create your contract"}
            </p>
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
