import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Heart, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useConsentFlow } from "@/contexts/ConsentFlowContext";

interface PressForYesData {
  contractId?: string;
  isCollaborative?: boolean;
  encounterType?: string;
}

export default function PressForYesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state } = useConsentFlow();
  const [isPressed, setIsPressed] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [pressProgress, setPressProgress] = useState(0);
  
  // Get contract data from query params or context
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get("contractId") || undefined;
  const isCollaborative = urlParams.get("collaborative") === "true";
  const encounterType = state.encounterType || urlParams.get("encounterType") || "Consent";
  
  // Title IX standard: 3 second hold requirement
  const REQUIRED_HOLD_TIME = 3000;

  useEffect(() => {
    if (!contractId) {
      toast({
        title: "Missing Information",
        description: "No contract found. Please start from the beginning.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [contractId, navigate, toast]);

  const confirmConsentMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("No contract ID");
      
      const response = await apiRequest("POST", `/api/contracts/${contractId}/confirm-consent`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      
      if (data.allPartiesConfirmed) {
        toast({
          title: "Contract Activated! ✓",
          description: "All parties have confirmed. Your consent documentation is now active.",
          duration: 4000,
        });
      } else {
        toast({
          title: "Confirmation Recorded",
          description: isCollaborative 
            ? "Waiting for other parties to confirm. You'll be notified when all parties have confirmed."
            : "Your confirmation has been recorded.",
          duration: 4000,
        });
      }
      
      // Navigate to contracts page after short delay
      setTimeout(() => {
        navigate("/files");
      }, 1500);
    },
    onError: (error: Error) => {
      setIsPressed(false);
      setPressStartTime(null);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm consent",
        variant: "destructive",
      });
    },
  });

  // Progress animation during press
  useEffect(() => {
    let animationFrame: number;
    
    if (isPressed && pressStartTime) {
      const updateProgress = () => {
        const elapsed = Date.now() - pressStartTime;
        const progress = Math.min((elapsed / REQUIRED_HOLD_TIME) * 100, 100);
        setPressProgress(progress);
        
        if (progress < 100) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          // 3 seconds complete - confirm automatically
          confirmConsentMutation.mutate();
        }
      };
      
      animationFrame = requestAnimationFrame(updateProgress);
    } else {
      setPressProgress(0);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPressed, pressStartTime, confirmConsentMutation]);

  const handlePressStart = () => {
    setIsPressed(true);
    setPressStartTime(Date.now());
  };

  const handlePressEnd = () => {
    const pressDuration = pressStartTime ? Date.now() - pressStartTime : 0;
    
    // Title IX requirement: Must hold for full 3 seconds
    if (pressDuration >= REQUIRED_HOLD_TIME) {
      // Already handled by animation effect
      return;
    } else {
      // Released too early - reset
      setIsPressed(false);
      setPressStartTime(null);
      setPressProgress(0);
      toast({
        title: "Hold for 3 Seconds",
        description: "Press and hold the button for the full 3 seconds to confirm your consent.",
      });
    }
  };

  const handleCancel = () => {
    setIsPressed(false);
    setPressStartTime(null);
    setPressProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/files")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Final Confirmation</h1>
            <p className="text-xs text-muted-foreground">{encounterType}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-full blur-2xl" />
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-full">
                <Heart className="h-12 w-12 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">
              Press for Yes
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This is your final confirmation of mutual consent.
              {isCollaborative && " All parties must confirm to activate the contract."}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Press and hold for 3 seconds to confirm your consent
            </p>
          </div>

          {/* Iconic Press Button */}
          <div className="py-8 px-4">
            <button
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handleCancel}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              disabled={confirmConsentMutation.isPending}
              className={`
                relative w-full max-w-md mx-auto h-32
                bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500
                rounded-lg border-2 border-green-600
                shadow-2xl overflow-hidden
                transition-all duration-200 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isPressed 
                  ? 'scale-[0.98] shadow-lg' 
                  : 'scale-100 hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
              data-testid="button-press-for-yes"
            >
              {/* Horizontal Progress Fill */}
              {isPressed && pressProgress < 100 && (
                <div 
                  className="absolute inset-0 bg-white/20 transition-all duration-100 ease-linear"
                  style={{
                    width: `${pressProgress}%`,
                  }}
                />
              )}
              
              {/* Glow effect */}
              <div className={`
                absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400
                blur-xl opacity-0 transition-opacity duration-300
                ${isPressed ? 'opacity-40' : ''}
              `} />
              
              {/* Button content */}
              <div className="relative flex flex-col items-center justify-center h-full text-white px-6">
                {confirmConsentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mb-2" />
                    <span className="text-sm font-medium">Confirming...</span>
                  </>
                ) : isPressed ? (
                  <>
                    <div className="text-5xl font-bold mb-1">
                      {Math.ceil((REQUIRED_HOLD_TIME - (Date.now() - (pressStartTime || 0))) / 1000)}
                    </div>
                    <span className="text-sm font-medium">Hold to Confirm...</span>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold mb-2">Press for Yes</div>
                    <span className="text-sm opacity-90">Hold for 3 seconds to confirm</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Legal Notice */}
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By confirming, you acknowledge that:
              <br />• You have reviewed all consent documentation
              <br />• This confirmation is voluntary and intentional  
              <br />• Consent can be withdrawn at any time
              <br />• This creates a legally binding record
            </p>
          </Card>

          {/* Cancel Option */}
          {!confirmConsentMutation.isPending && (
            <Button
              variant="ghost"
              onClick={() => navigate("/files")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
