import { Card } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function SharePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Share Documents</h1>
        <p className="text-muted-foreground">
          Share your consent documentation securely
        </p>
      </div>

      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Share2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Sharing Features Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Securely share your consent documents with relevant parties while maintaining 
              privacy and control over your information.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
