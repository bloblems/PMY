import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { X, Share2, Link as LinkIcon, Download, MoreHorizontal, Palette } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation } from "wouter";
import PMYLogo from "@/components/PMYLogo";

interface UserData {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  profile?: {
    profilePictureUrl?: string | null;
    bio?: string | null;
    websiteUrl?: string | null;
  };
}

const gradientColors = [
  { 
    name: "PMY Green", 
    from: "from-primary", 
    to: "to-emerald-600",
    // Use CSS variable for primary, fallback hex for emerald
    cssVars: { start: "--primary", end: null },
    fallbackHex: { start: "#22c55e", end: "#059669" }
  },
  { 
    name: "Dark", 
    from: "from-gray-900", 
    to: "to-emerald-900",
    cssVars: { start: null, end: null },
    fallbackHex: { start: "#111827", end: "#064e3b" }
  },
  { 
    name: "Midnight", 
    from: "from-black", 
    to: "to-primary",
    cssVars: { start: null, end: "--primary" },
    fallbackHex: { start: "#000000", end: "#22c55e" }
  },
];

// Helper function to get computed color from CSS variable or fallback
const getGradientColor = (cssVar: string | null, fallbackHex: string): string => {
  if (cssVar) {
    const computedValue = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
    
    // If CSS variable returns HSL format (e.g., "142 71% 45%"), convert to hex
    if (computedValue && !computedValue.startsWith('#')) {
      // Parse HSL values
      const hslMatch = computedValue.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
      if (hslMatch) {
        const h = parseInt(hslMatch[1]);
        const s = parseInt(hslMatch[2]);
        const l = parseInt(hslMatch[3]);
        return hslToHex(h, s, l);
      }
    }
    
    return computedValue || fallbackHex;
  }
  return fallbackHex;
};

// Convert HSL to Hex
const hslToHex = (h: number, s: number, l: number): string => {
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  
  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lDecimal - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function SharePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Fetch user profile data
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });

  // Fetch user's referral code
  const { data: referralData } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/user/referral-code"],
    enabled: !!user,
  });

  const userName = userData?.user?.name || "User";
  const referralLink = referralData?.referralCode 
    ? `${window.location.origin}/?ref=${referralData.referralCode}`
    : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on PMY`,
          text: `Use my referral code: ${referralData?.referralCode || ''}`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownload = () => {
    if (!qrCardRef.current) return;

    // Create a canvas from the QR code SVG
    const svg = qrCardRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 900;

    // Get selected gradient colors (computed at download time for theme accuracy)
    const gradient = gradientColors[selectedGradient];
    const startColor = getGradientColor(gradient.cssVars.start, gradient.fallbackHex.start);
    const endColor = getGradientColor(gradient.cssVars.end, gradient.fallbackHex.end);
    
    const gradientFill = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradientFill.addColorStop(0, startColor);
    gradientFill.addColorStop(1, endColor);

    // Fill background with gradient
    ctx.fillStyle = gradientFill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white card with rounded corners
    ctx.fillStyle = 'white';
    ctx.beginPath(); // Essential: start path before drawing
    
    // Fallback for older browsers that don't support roundRect
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(50, 150, 700, 600, 24);
    } else {
      // Manual rounded rectangle fallback
      const x = 50, y = 150, width = 700, height = 600, radius = 24;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
    ctx.fill();

    // Create an image from SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, 200, 200, 400, 400);

      // Draw PMY text
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('PMY', 400, 680);

      // Draw username
      ctx.fillStyle = '#666';
      ctx.font = '32px system-ui';
      ctx.fillText(`@${userName.toLowerCase().replace(/\s+/g, '')}`, 400, 720);

      // Convert to image and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pmy-qr-${userName}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;

    toast({
      title: "Downloaded!",
      description: "QR code saved to your device.",
    });
  };

  const currentGradient = gradientColors[selectedGradient];

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Main QR Code View */}
      <div className={`relative min-h-screen bg-gradient-to-br ${currentGradient.from} ${currentGradient.to} overflow-hidden`}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation('/profile')}
            className="text-white hover:bg-white/20"
            data-testid="button-close-share"
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="text-white hover:bg-white/20 rounded-full px-4"
            data-testid="button-color-picker"
          >
            <Palette className="h-4 w-4 mr-2" />
            COLOR
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="text-white hover:bg-white/20"
            data-testid="button-more-options"
          >
            <MoreHorizontal className="h-6 w-6" />
          </Button>
        </div>

        {/* Color Picker Dropdown */}
        {showColorPicker && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
            <div className="flex gap-2">
              {gradientColors.map((gradient, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedGradient(index);
                    setShowColorPicker(false);
                  }}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient.from} ${gradient.to} border-4 ${
                    selectedGradient === index ? 'border-white scale-110' : 'border-transparent'
                  } transition-all hover:scale-105`}
                  aria-label={gradient.name}
                  data-testid={`color-${index}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* QR Code Card */}
        <div className="flex items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-sm">
            <div
              ref={qrCardRef}
              className="bg-white rounded-3xl p-8 shadow-2xl mb-6"
              data-testid="qr-card"
            >
              {/* QR Code with PMY Logo */}
              <div className="relative bg-white p-4 rounded-2xl mb-6">
                <QRCodeSVG
                  value={referralLink}
                  size={280}
                  level="H"
                  className="w-full h-auto"
                  fgColor="#22c55e"
                  data-testid="qr-code"
                />
                {/* PMY Logo Overlay - centered in QR code */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-3 shadow-lg">
                  <PMYLogo className="text-3xl text-primary" />
                </div>
              </div>

              {/* Username */}
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  @{userName.toLowerCase().replace(/\s+/g, '')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Scan to join PMY
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 hover-elevate active-elevate-2 transition-all"
                data-testid="button-share"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">Share</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 hover-elevate active-elevate-2 transition-all"
                data-testid="button-copy-link"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <LinkIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">Copy link</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex flex-col items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 hover-elevate active-elevate-2 transition-all"
                data-testid="button-download"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* More Options Bottom Sheet */}
        {showMoreOptions && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl p-6 shadow-2xl max-h-[70vh] overflow-y-auto">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
            
            <Tabs defaultValue="invite" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="invite">Invite Friends</TabsTrigger>
                <TabsTrigger value="about">About QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="invite" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Invite Friends to PMY</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your referral code and help friends discover secure Title IX consent documentation.
                  </p>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-1">Your Referral Code</div>
                    <div className="text-2xl font-bold text-primary font-mono">
                      {referralData?.referralCode || "Loading..."}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleShare}
                    className="flex-1"
                    data-testid="button-share-invite"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Invite
                  </Button>
                  <Button
                    onClick={() => {
                      setShowMoreOptions(false);
                      setLocation('/profile');
                    }}
                    variant="outline"
                    data-testid="button-view-profile"
                  >
                    View Profile
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">How it works</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Your QR code contains your unique PMY referral link. When someone scans it, they'll be directed to PMY and credited to your referrals.
                    </p>
                    <p>
                      The QR code is designed with PMY's colors and your username for easy recognition. You can customize the background gradient to match your style.
                    </p>
                    <p>
                      Download the QR code to share it in your social media posts, presentations, or print materials.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowMoreOptions(false)}
                  variant="outline"
                  className="w-full"
                  data-testid="button-close-more"
                >
                  Close
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
