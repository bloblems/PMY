import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Upload, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureInputProps {
  label?: string;
  onSignatureComplete: (signature: string, type: "draw" | "type" | "upload", text?: string) => void;
  onClear?: () => void;
  savedSignature?: string;
  savedSignatureType?: "draw" | "type" | "upload";
  savedSignatureText?: string;
  allowSave?: boolean;
  onSavePreferenceChange?: (shouldSave: boolean) => void;
  autoPopulate?: boolean;
  currentSignature?: string | null;
}

export default function SignatureInput({
  label = "Signature",
  onSignatureComplete,
  onClear,
  savedSignature,
  savedSignatureType,
  savedSignatureText,
  allowSave = false,
  onSavePreferenceChange,
  autoPopulate = false,
  currentSignature = null,
}: SignatureInputProps) {
  const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload" | "saved">(
    savedSignature ? "saved" : "draw"
  );
  const [typedName, setTypedName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [shouldSave, setShouldSave] = useState(false);
  const hasAutoPopulatedRef = useRef(false);
  const canvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-populate saved signature ONLY if:
  // 1. autoPopulate is enabled
  // 2. Parent doesn't already have a signature (prevents overwriting manual entries)
  // 3. We have a saved signature to populate with
  // 4. We haven't already auto-populated (using ref to survive remounts)
  useEffect(() => {
    if (
      autoPopulate && 
      !currentSignature && 
      savedSignature && 
      savedSignatureType && 
      !hasAutoPopulatedRef.current
    ) {
      onSignatureComplete(savedSignature, savedSignatureType, savedSignatureText);
      hasAutoPopulatedRef.current = true;
    }
  }, [autoPopulate, currentSignature, savedSignature, savedSignatureType, savedSignatureText]);

  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      resizeCanvas();
    }
  }, [activeTab]);

  const resizeCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.getCanvas();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);
  };

  const handleDrawComplete = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataURL = canvasRef.current.toDataURL("image/png");
      onSignatureComplete(dataURL, "draw");
    }
  };

  const handleTypedSignature = () => {
    if (!typedName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to create a typed signature.",
        variant: "destructive",
      });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "black";
      ctx.font = "48px 'Brush Script MT', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
      
      const dataURL = canvas.toDataURL("image/png");
      onSignatureComplete(dataURL, "type", typedName);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setUploadedImage(dataURL);
      onSignatureComplete(dataURL, "upload");
    };
    reader.readAsDataURL(file);
  };

  const handleClearDraw = () => {
    canvasRef.current?.clear();
    onClear?.();
  };

  const handleClearType = () => {
    setTypedName("");
    onClear?.();
  };

  const handleClearUpload = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear?.();
  };

  const handleUseSaved = () => {
    if (savedSignature && savedSignatureType) {
      onSignatureComplete(savedSignature, savedSignatureType, savedSignatureText);
    }
  };

  const handleSavePreferenceChange = (checked: boolean) => {
    setShouldSave(checked);
    onSavePreferenceChange?.(checked);
  };

  return (
    <div className="space-y-4" data-testid="signature-input">
      <Label className="text-base font-medium">{label}</Label>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4" data-testid="signature-tabs">
          <TabsTrigger value="draw" data-testid="tab-draw">Draw</TabsTrigger>
          <TabsTrigger value="type" data-testid="tab-type">Type</TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload">Upload</TabsTrigger>
          {savedSignature && (
            <TabsTrigger value="saved" data-testid="tab-saved">Saved</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="draw" className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Draw your signature below</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDraw}
                    data-testid="button-clear-draw"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="border-2 border-input rounded-lg bg-background">
                  <SignatureCanvas
                    ref={canvasRef}
                    canvasProps={{
                      className: "w-full h-40 touch-none cursor-crosshair",
                      style: { maxWidth: "100%" },
                    }}
                    onEnd={handleDrawComplete}
                    penColor="black"
                    minWidth={0.5}
                    maxWidth={2.5}
                    velocityFilterWeight={0.7}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Sign above using your mouse, finger, or stylus
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="type" className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="typed-name">Full Name</Label>
                  <Input
                    id="typed-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleTypedSignature();
                      }
                    }}
                    data-testid="input-typed-name"
                    className="font-serif"
                  />
                </div>
                {typedName && (
                  <div className="border-2 border-input rounded-lg bg-background p-6 text-center">
                    <p
                      className="text-5xl"
                      style={{ fontFamily: "'Brush Script MT', cursive" }}
                    >
                      {typedName}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleTypedSignature}
                    disabled={!typedName.trim()}
                    data-testid="button-use-typed"
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Use This Signature
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearType}
                    data-testid="button-clear-type"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Label>Upload Signature Image</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-upload-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2"
                    data-testid="button-upload"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, or other image formats (max 5MB)
                  </p>
                </div>
                {uploadedImage && (
                  <div className="border-2 border-input rounded-lg bg-background p-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded signature"
                      className="max-h-32 mx-auto"
                      data-testid="img-uploaded-signature"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUpload}
                      className="w-full mt-3"
                      data-testid="button-clear-upload"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {savedSignature && (
          <TabsContent value="saved" className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Use your previously saved signature
                  </p>
                  <div className="border-2 border-input rounded-lg bg-background p-4">
                    <img
                      src={savedSignature}
                      alt="Saved signature"
                      className="max-h-32 mx-auto"
                      data-testid="img-saved-signature"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleUseSaved}
                    className="w-full"
                    data-testid="button-use-saved"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Use Saved Signature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {allowSave && activeTab !== "saved" && (
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="save-signature"
            checked={shouldSave}
            onCheckedChange={handleSavePreferenceChange}
            data-testid="checkbox-save-signature"
          />
          <label
            htmlFor="save-signature"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Save this signature for future use
          </label>
        </div>
      )}
    </div>
  );
}
