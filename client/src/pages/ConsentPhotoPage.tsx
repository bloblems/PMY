import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useConsentFlow } from "@/contexts/ConsentFlowContext";

export default function ConsentPhotoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  
  // Defensive routing: redirect if required state is missing (after hydration)
  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      toast({
        title: "Missing Information",
        description: "Please complete the consent flow from the beginning.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isHydrated, hasRequiredData, navigate, toast]);
  
  const { universityId, universityName, encounterType, parties, intimateActs } = state;

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!photoFile) throw new Error("No photo selected");

      const formData = new FormData();
      formData.append("photo", photoFile);
      if (universityId) {
        formData.append("universityId", universityId);
      }
      formData.append("encounterType", encounterType);
      formData.append("parties", JSON.stringify(parties));

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch("/api/consent-photos", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-contracts"] });
      toast({
        title: "Photo Saved",
        description: "Your dual selfie consent has been saved successfully.",
      });
      navigate("/files");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Dual Selfie</h1>
          <p className="text-sm text-muted-foreground">{universityName}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Upload Consent Photo</h3>
            <p className="text-sm text-muted-foreground">
              Both parties should appear in the photo, clearly showing mutual agreement.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
            <p className="font-medium">Photo Guidelines:</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Both parties must be clearly visible</li>
              <li>Photo should show both people together</li>
              <li>Consider using thumbs up or other clear gesture of agreement</li>
              <li>Ensure good lighting and clear visibility</li>
            </ul>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />

          {photoPreview ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border-2 border-green-600 dark:border-green-400">
                <img
                  src={photoPreview}
                  alt="Consent photo preview"
                  className="w-full h-auto max-h-96 object-contain bg-muted"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2"
                  data-testid="button-remove-photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
                data-testid="button-save-photo"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Saving..." : "Save Photo"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
              data-testid="button-select-photo"
            >
              <Camera className="w-4 h-4 mr-2" />
              Select Photo
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
